import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Loading, Notice, PrimaryButton, Screen, ui } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { api } from '../lib/api';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/auth.store';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const { data, isLoading, isError } = useQuery({ queryKey: ['me'], queryFn: () => api.me(session!), enabled: Boolean(session) });
  if (!session) return <Screen style={styles.center}><Text style={ui.subtitle}>로그인 후 학습 기록을 확인할 수 있습니다.</Text><PrimaryButton title="로그인하기" onPress={() => navigation.navigate('Auth')} /></Screen>;
  if (isLoading) return <Loading label="학습 기록을 불러오는 중…" />;
  return <Screen><ScrollView contentContainerStyle={styles.content}><View><Text style={styles.name}>{data?.name ?? session.user.name} 님</Text><Text style={ui.subtitle}>내 학습 현황과 저장한 항목을 확인하세요.</Text></View>{isError && <Notice>학습 기록을 불러오지 못했습니다. 다시 시도해 주세요.</Notice>}
    <View style={styles.stats}><View style={styles.stat}><Text style={styles.number}>{data?._count.quizAttempts ?? 0}</Text><Text style={styles.caption}>완료한 시험</Text></View><View style={styles.stat}><Text style={styles.number}>{data?._count.wrongAnswers ?? 0}</Text><Text style={styles.caption}>오답 노트</Text></View><View style={styles.stat}><Text style={styles.number}>{data?._count.favorites ?? 0}</Text><Text style={styles.caption}>관심 항목</Text></View></View>
    <Text style={ui.sectionTitle}>최근 시험</Text>{data?.quizAttempts.length ? data.quizAttempts.map((attempt) => <View key={attempt.id} style={ui.card}><Text style={styles.attempt}>{attempt.mode === 'QUICK' ? '퀵 테스트' : '실전 모드'} · {attempt.licenseType === 'FIRST_NORMAL' ? '1종 보통' : '2종 보통'}</Text><Text style={styles.attemptScore}>{attempt.score} / {attempt.total}</Text></View>) : <Text style={ui.muted}>아직 저장된 시험 결과가 없습니다.</Text>}
    <PrimaryButton title="로그아웃" secondary onPress={() => void signOut()} />
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  name: { fontSize: 26, fontWeight: '900', color: colors.ink },
  stats: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  number: { fontSize: 21, fontWeight: '900', color: colors.primary },
  caption: { color: colors.muted, fontSize: 12 },
  attempt: { fontWeight: '700', color: colors.ink },
  attemptScore: { color: colors.primary, marginTop: spacing.sm, fontWeight: '900', fontSize: 17 },
});
