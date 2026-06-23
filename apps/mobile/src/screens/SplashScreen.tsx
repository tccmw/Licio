import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLocationStore } from '../store/location.store';
import { useOnboardingStore } from '../store/onboarding.store';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;
type PermissionState = 'requesting' | 'denied' | 'error';

const REGIONS = [
  { label: '서울', latitude: 37.5665, longitude: 126.978 },
  { label: '경기', latitude: 37.4138, longitude: 127.5183 },
  { label: '부산', latitude: 35.1796, longitude: 129.0756 },
  { label: '대구', latitude: 35.8714, longitude: 128.6014 },
];

export function SplashScreen({ navigation }: Props) {
  const setLocation = useLocationStore((state) => state.setLocation);
  const setRequested = useOnboardingStore((state) => state.setLocationRequested);
  const setManualRegion = useOnboardingStore((state) => state.setManualRegion);
  const requestInProgress = useRef(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('requesting');

  const requestDeviceLocation = async () => {
    if (requestInProgress.current) return;
    requestInProgress.current = true;
    setRequested();
    setPermissionState('requesting');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setPermissionState('denied');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: '현재 위치',
        isDeviceLocation: true,
      });
      navigation.replace('Home');
    } catch {
      setPermissionState('error');
    } finally {
      requestInProgress.current = false;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void requestDeviceLocation(), 900);
    return () => clearTimeout(timer);
  }, []);

  const chooseRegion = (region: typeof REGIONS[number]) => {
    setRequested();
    setManualRegion(region.label);
    setLocation({ ...region, label: `${region.label} 중심`, isDeviceLocation: false });
    navigation.replace('Home');
  };

  const fallbackMessage = permissionState === 'denied'
    ? '위치 권한을 허용하면 가까운 운전학원을 바로 찾을 수 있어요.'
    : '현재 위치를 가져오지 못했습니다. 권한을 다시 확인하거나 지역을 선택해 주세요.';

  return <View style={styles.screen}>
    <View style={styles.brand}>
      <Image source={require('../../assets/licio-logo.png')} style={styles.logo} accessibilityLabel="Licio 로고" />
      <Text style={styles.wordmark}>Licio</Text>
      {permissionState === 'requesting' && <Text style={styles.loadingText}>운전 면허를 한눈에</Text>}
    </View>

    {permissionState !== 'requesting' && <View style={styles.fallbackPanel}>
      <Text style={styles.title}>위치 권한이 필요해요</Text>
      <Text style={styles.description}>{fallbackMessage}</Text>
      <View style={styles.buttonGap} />
      <PrimaryButton title="위치 권한 다시 요청" onPress={() => void requestDeviceLocation()} />
      <Text style={styles.manualTitle}>또는 지역을 직접 선택하세요</Text>
      <View style={styles.regionGrid}>
        {REGIONS.map((region) => <Pressable key={region.label} accessibilityRole="button" style={styles.region} onPress={() => chooseRegion(region)}><Text style={styles.regionText}>{region.label}</Text></Pressable>)}
      </View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: spacing.xl },
  logo: { width: 148, height: 148 },
  wordmark: { color: colors.ink, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: spacing.md },
  loadingText: { color: colors.muted, fontSize: 14, marginTop: spacing.sm },
  fallbackPanel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: spacing.md },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  buttonGap: { height: spacing.md },
  manualTitle: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  region: { alignItems: 'center', backgroundColor: '#E0F2FE', borderRadius: 12, paddingVertical: 12, width: '47%' },
  regionText: { color: colors.primary, fontWeight: '800' },
});
