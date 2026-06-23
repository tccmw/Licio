import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Screen, ui } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizResult'>;

export function QuizResultScreen({ route, navigation }: Props) {
  const { result } = route.params;
  const incorrect = result.answers.filter((answer) => !answer.isCorrect);
  return <Screen><ScrollView contentContainerStyle={styles.content}><View style={styles.scoreCard}><Text style={styles.caption}>모의시험 결과</Text><Text style={styles.score}>{result.score}<Text style={styles.total}> / {result.total}</Text></Text><Text style={styles.message}>{result.score === result.total ? '완벽합니다. 다음 단계도 준비해 보세요.' : `${incorrect.length}개 문항을 오답 노트에 저장했어요.`}</Text></View>
    <Text style={ui.sectionTitle}>오답 확인</Text>{incorrect.length === 0 && <Text style={ui.muted}>틀린 문항이 없습니다.</Text>}{incorrect.map((answer, index) => <View style={ui.card} key={answer.questionId}><Text style={styles.wrong}>오답 {index + 1}</Text><Text style={styles.explanation}>{answer.explanation}</Text></View>)}
    <PrimaryButton title="홈으로 돌아가기" onPress={() => navigation.popToTop()} />
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  scoreCard: { backgroundColor: colors.primary, borderRadius: 20, padding: spacing.xl, alignItems: 'center' },
  caption: { color: '#BFDBFE', fontWeight: '800' },
  score: { color: '#fff', fontWeight: '900', fontSize: 50, marginTop: spacing.sm },
  total: { color: '#BFDBFE', fontSize: 22 },
  message: { color: '#E0F2FE', textAlign: 'center', marginTop: spacing.sm, lineHeight: 21 },
  wrong: { color: colors.danger, fontWeight: '800', marginBottom: spacing.sm },
  explanation: { color: colors.ink, lineHeight: 21 },
});
