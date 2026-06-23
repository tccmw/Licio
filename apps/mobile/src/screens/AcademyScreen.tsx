import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Notice, Screen, ui } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { api } from '../lib/api';
import { useLocationStore } from '../store/location.store';
import { useAuthStore } from '../store/auth.store';

const distance = (meters: number) => meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;

export function AcademyScreen() {
  const location = useLocationStore();
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['academies', location.latitude, location.longitude], queryFn: () => api.nearbyAcademies(location.latitude, location.longitude) });
  const { data: favorites = [] } = useQuery({ queryKey: ['favorites'], queryFn: () => api.favorites(session!), enabled: Boolean(session) });
  const favoriteMutation = useMutation({
    mutationFn: async (academy: { id: string; name: string }) => {
      const exists = favorites.some((favorite) => favorite.type === 'ACADEMY' && favorite.targetId === academy.id);
      return exists ? api.removeFavorite(session!, 'ACADEMY', academy.id) : api.addFavorite(session!, 'ACADEMY', academy.id, academy.name);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });
  const openDirections = (latitude: number, longitude: number) => void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);

  return <Screen><View style={styles.mapWrap}>
    <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 }} showsUserLocation={location.isDeviceLocation}>
      <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} title={location.label} pinColor={colors.primary} />
      {data?.academies.map((academy) => <Marker key={academy.id} coordinate={{ latitude: academy.latitude, longitude: academy.longitude }} title={academy.name} description={academy.address} pinColor={colors.accent} />)}
    </MapView>
  </View><ScrollView contentContainerStyle={styles.list}>
    {data?.source === 'demo' && <Notice>현재 지도에는 데모 학원 정보를 표시합니다.</Notice>}
    {isLoading && <Text style={ui.muted}>주변 학원을 찾는 중…</Text>}
    {isError && <Notice>학원 정보를 불러오지 못했습니다.</Notice>}
    {data?.academies.map((academy) => { const favorite = favorites.some((item) => item.type === 'ACADEMY' && item.targetId === academy.id); return <View key={academy.id} style={ui.card}><View style={styles.row}><Text style={styles.name}>{academy.name}</Text><Text style={styles.distance}>{distance(academy.distanceMeters)}</Text></View><Text style={ui.muted}>{academy.address}</Text><View style={styles.footer}><Text style={styles.rating}>{academy.rating ? `★ ${academy.rating.toFixed(1)}` : '평점 없음'}</Text><View style={styles.actions}>{session && <Pressable disabled={favoriteMutation.isPending} onPress={() => favoriteMutation.mutate(academy)}><Text style={styles.favorite}>{favorite ? '♥ 관심' : '♡ 관심'}</Text></Pressable>}<Pressable onPress={() => openDirections(academy.latitude, academy.longitude)}><Text style={styles.route}>길찾기</Text></Pressable></View></View></View>; })}
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  mapWrap: { height: '46%', overflow: 'hidden' },
  map: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1, fontWeight: '800', fontSize: 16, color: colors.ink },
  distance: { color: colors.primary, fontWeight: '800' },
  footer: { marginTop: spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: spacing.md },
  rating: { color: '#D97706', fontWeight: '700' },
  favorite: { color: colors.danger, fontWeight: '800' },
  route: { color: colors.primary, fontWeight: '800' },
});
