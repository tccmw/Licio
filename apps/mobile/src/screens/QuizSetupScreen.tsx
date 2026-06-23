import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Notice, PrimaryButton, Screen, ui } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { api } from '../lib/api';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useQuizStore } from '../store/quiz.store';
import { LicenseType, QuizMode } from '../types/domain';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizSetup'>;

export function QuizSetupScreen({ navigation }: Props) {
  const [licenseType, setLicenseType] = useState<LicenseType>('SECOND_NORMAL');
  const [mode, setMode] = useState<QuizMode>('QUICK');
  const start = useQuizStore((state) => state.start);
  const mutation = useMutation({
    mutationFn: () => api.questions(licenseType, mode),
    onSuccess: (data) => { start(data.questions, licenseType, mode); navigation.navigate('QuizPlay'); },
  });

  return <Screen style={styles.screen}><Text style={ui.title}>오늘의 모의시험</Text><Text style={ui.subtitle}>현재 수준을 확인하고 약한 문항을 찾아보세요.</Text>
    <Text style={styles.label}>면허 종류</Text><View style={styles.row}>{([['FIRST_NORMAL', '1종 보통'], ['SECOND_NORMAL', '2종 보통']] as const).map(([value, label]) => <Pressable key={value} onPress={() => setLicenseType(value)} style={[styles.option, licenseType === value && styles.selected]}><Text style={[styles.optionText, licenseType === value && styles.selectedText]}>{label}</Text></Pressable>)}</View>
    <Text style={styles.label}>시험 방식</Text><View style={styles.modeList}><Pressable onPress={() => setMode('QUICK')} style={[styles.mode, mode === 'QUICK' && styles.selected]}><Text style={styles.modeTitle}>퀵 테스트</Text><Text style={styles.modeBody}>10문제 · 시간 제한 없음</Text></Pressable><Pressable onPress={() => setMode('MOCK')} style={[styles.mode, mode === 'MOCK' && styles.selected]}><Text style={styles.modeTitle}>실전 모드</Text><Text style={styles.modeBody}>40문제 · 60분 타이머</Text></Pressable></View>
    <Notice>현재 제공되는 문항은 UI 검증용 데모 콘텐츠입니다. 실제 시험 준비에는 공식 최신 자료를 확인하세요.</Notice>
    {mutation.isError && <Text style={styles.error}>{mutation.error.message}</Text>}
    <View style={styles.bottom}><PrimaryButton title={mutation.isPending ? '문항 준비 중…' : `${mode === 'QUICK' ? '10문제' : '40문제'} 시작하기`} disabled={mutation.isPending} onPress={() => mutation.mutate()} /></View>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md },
  label: { marginTop: spacing.xl, marginBottom: spacing.sm, color: colors.ink, fontWeight: '800' },
  row: { flexDirection: 'row', gap: spacing.sm },
  option: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 12, alignItems: 'center', padding: 14, backgroundColor: '#fff' },
  selected: { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
  optionText: { color: colors.muted, fontWeight: '800' },
  selectedText: { color: colors.primary },
  modeList: { gap: spacing.sm, marginBottom: spacing.lg },
  mode: { ...ui.card },
  modeTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  modeBody: { color: colors.muted, marginTop: spacing.xs },
  error: { color: colors.danger, marginTop: spacing.md },
  bottom: { marginTop: 'auto', paddingTop: spacing.md },
});
