import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../lib/api';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/auth.store';
import { useLocationStore } from '../store/location.store';
import { colors, spacing } from '../constants/theme';
import { Notice, Screen, ui } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const distance = (meters: number) => meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;

export function HomeScreen({ navigation }: Props) {
  const location = useLocationStore();
  const session = useAuthStore((state) => state.session);
  const { data, isLoading, isError } = useQuery({ queryKey: ['academies', location.latitude, location.longitude], queryFn: () => api.nearbyAcademies(location.latitude, location.longitude) });

  return <Screen><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.head}><View><Text style={styles.eyebrow}>{location.label}</Text><Text style={ui.title}>오늘도 안전하게,{`\n`}면허 준비 시작</Text></View><Pressable style={styles.profile} onPress={() => navigation.navigate(session ? 'Profile' : 'Auth')}><Text style={styles.profileText}>{session ? session.user.name.slice(0, 1) : '로그인'}</Text></Pressable></View>
    {data?.source === 'demo' && <Notice>데모 학원 정보를 표시 중입니다. Google Places 키를 연결하면 실제 검색 결과로 바뀝니다.</Notice>}
    <View style={styles.actionRow}>
      <Pressable style={[styles.action, styles.quizAction]} onPress={() => navigation.navigate('QuizSetup')}><Text style={styles.actionIcon}>✦</Text><Text style={styles.actionTitle}>모의시험</Text><Text style={styles.actionBody}>퀵 테스트 또는{`\n`}40문제 실전 모드</Text></Pressable>
      <Pressable style={[styles.action, styles.dateAction]} onPress={() => navigation.navigate('Schedule')}><Text style={styles.actionIcon}>▦</Text><Text style={styles.actionTitle}>시험 일정</Text><Text style={styles.actionBody}>캘린더에서{`\n`}시험일 확인</Text></Pressable>
    </View>
    <View style={styles.sectionHeader}><Text style={ui.sectionTitle}>내 주변 운전학원</Text><Pressable onPress={() => navigation.navigate('Academies')}><Text style={styles.link}>지도 보기</Text></Pressable></View>
    {isLoading && <Text style={ui.muted}>주변 학원을 찾는 중…</Text>}
    {isError && <Notice>학원 정보를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.</Notice>}
    {data?.academies.slice(0, 3).map((academy) => <Pressable key={academy.id} style={ui.card} onPress={() => navigation.navigate('Academies')}><View style={styles.academyTop}><Text style={styles.academyName}>{academy.name}</Text><Text style={styles.distance}>{distance(academy.distanceMeters)}</Text></View><Text style={ui.muted}>{academy.address ?? '주소 정보 없음'}</Text>{academy.rating && <Text style={styles.rating}>★ {academy.rating.toFixed(1)}</Text>}</Pressable>)}
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.sm },
  eyebrow: { color: colors.secondary, fontWeight: '800', marginBottom: spacing.md },
  profile: { minWidth: 48, height: 40, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  profileText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1, borderRadius: 18, padding: spacing.md, minHeight: 150 },
  quizAction: { backgroundColor: colors.primary },
  dateAction: { backgroundColor: colors.accent },
  actionIcon: { color: '#fff', fontSize: 24, marginBottom: spacing.sm },
  actionTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  actionBody: { color: '#E0F2FE', marginTop: spacing.xs, lineHeight: 18 },
  sectionHeader: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '800' },
  academyTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  academyName: { flex: 1, color: colors.ink, fontWeight: '800', fontSize: 16 },
  distance: { color: colors.primary, fontWeight: '800' },
  rating: { color: '#D97706', marginTop: spacing.sm, fontWeight: '700' },
});
