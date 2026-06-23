import { LicenseType, Question } from '@prisma/client';
import { scoreAnswers } from './quiz.service';

const question = (id: string, answerIndex: number) => ({
  id,
  licenseType: LicenseType.FIRST_NORMAL,
  prompt: id,
  choices: ['a', 'b', 'c', 'd'],
  answerIndex,
  explanation: '',
  isDemo: true,
  createdAt: new Date(),
}) as Question;

describe('scoreAnswers', () => {
  it('scores only known question ids', () => {
    const result = scoreAnswers([question('one', 1), question('two', 2)], [
      { questionId: 'one', selectedIndex: 1 },
      { questionId: 'two', selectedIndex: 1 },
      { questionId: 'unknown', selectedIndex: 0 },
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((answer) => answer.isCorrect)).toEqual([true, false]);
  });
});
