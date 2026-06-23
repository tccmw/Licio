import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Screen, ui } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { api } from '../lib/api';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/auth.store';
import { useQuizStore } from '../store/quiz.store';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizPlay'>;

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function QuizPlayScreen({ navigation }: Props) {
  const { questions, answers, mode, licenseType, startedAt, answer, reset } = useQuizStore();
  const session = useAuthStore((state) => state.session);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(3600);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);
  const question = questions[index];
  const elapsed = useMemo(() => startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0, [startedAt, submitting]);

  const submit = useCallback(async () => {
    if (submitted.current || questions.length === 0 || Object.keys(answers).length !== questions.length) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      const result = await api.submitQuiz(session, licenseType, mode, startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0, questions.map((item) => ({ questionId: item.id, selectedIndex: answers[item.id] })));
      reset();
      navigation.replace('QuizResult', { result });
    } catch {
      submitted.current = false;
      setSubmitting(false);
    }
  }, [answers, licenseType, mode, navigation, questions, reset, session, startedAt]);

  useEffect(() => {
    if (mode !== 'MOCK' || submitting) return;
    const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [mode, submitting]);
  useEffect(() => { if (mode === 'MOCK' && remaining === 0) void submit(); }, [mode, remaining, submit]);

  if (!question) return <Screen style={styles.center}><Text style={ui.muted}>시험 문항을 불러오지 못했습니다.</Text></Screen>;
  const selected = answers[question.id];
  const isLast = index === questions.length - 1;
  const next = () => isLast ? void submit() : setIndex((value) => value + 1);

  return <Screen style={styles.screen}><View style={styles.top}><Text style={styles.progress}>{index + 1} / {questions.length}</Text>{mode === 'MOCK' && <Text style={styles.timer}>{clock(remaining)}</Text>}</View><View style={styles.bar}><View style={[styles.fill, { width: `${((index + 1) / questions.length) * 100}%` }]} /></View>
    <Text style={styles.question}>{question.prompt}</Text><View style={styles.choices}>{question.choices.map((choice, choiceIndex) => <Pressable key={choice} onPress={() => answer(question.id, choiceIndex)} style={[styles.choice, selected === choiceIndex && styles.choiceSelected]}><Text style={[styles.choiceNumber, selected === choiceIndex && styles.choiceNumberSelected]}>{choiceIndex + 1}</Text><Text style={[styles.choiceText, selected === choiceIndex && styles.choiceTextSelected]}>{choice}</Text></Pressable>)}</View>
    <View style={styles.bottom}>{submitting && <Text style={styles.saving}>결과를 저장하는 중…</Text>}<PrimaryButton title={isLast ? '제출하기' : '다음 문제'} disabled={selected === undefined || submitting} onPress={next} /></View>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md },
  center: { alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  progress: { fontWeight: '800', color: colors.primary },
  timer: { fontWeight: '900', color: colors.danger, fontVariant: ['tabular-nums'] },
  bar: { height: 6, backgroundColor: '#DBEAFE', borderRadius: 3, marginTop: spacing.sm },
  fill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  question: { marginTop: 40, fontSize: 21, fontWeight: '800', lineHeight: 31, color: colors.ink },
  choices: { marginTop: spacing.xl, gap: spacing.sm },
  choice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 62, borderRadius: 14, padding: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  choiceSelected: { backgroundColor: '#EFF6FF', borderColor: colors.primary },
  choiceNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', color: colors.muted, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', fontWeight: '800' },
  choiceNumberSelected: { backgroundColor: colors.primary, color: '#fff' },
  choiceText: { flex: 1, color: colors.ink, lineHeight: 21 },
  choiceTextSelected: { fontWeight: '700', color: colors.primary },
  bottom: { marginTop: 'auto', gap: spacing.sm },
  saving: { textAlign: 'center', color: colors.muted },
});
