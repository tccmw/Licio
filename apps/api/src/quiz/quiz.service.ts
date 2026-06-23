import { BadRequestException, Injectable } from '@nestjs/common';
import { LicenseType, Question } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionQueryDto, QuizMode, SubmitQuizDto } from './dto/quiz.dto';

const questionCount = (mode: QuizMode) => mode === QuizMode.QUICK ? 10 : 40;

type ScoredAnswer = { question: Question; selectedIndex: number; isCorrect: boolean };

export function scoreAnswers(questions: Question[], submitted: Array<{ questionId: string; selectedIndex: number }>) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  return submitted.flatMap<ScoredAnswer>((answer) => {
    const question = byId.get(answer.questionId);
    return question ? [{ question, selectedIndex: answer.selectedIndex, isCorrect: question.answerIndex === answer.selectedIndex }] : [];
  });
}

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async questions(query: QuestionQueryDto) {
    const questions = await this.prisma.question.findMany({ where: { licenseType: query.licenseType } });
    const requested = questionCount(query.mode);
    if (questions.length < requested) throw new BadRequestException(`이 면허 유형에는 최소 ${requested}개의 문항이 필요합니다.`);
    const selected = [...questions].sort(() => Math.random() - 0.5).slice(0, requested);
    return {
      mode: query.mode,
      isDemo: selected.some((question) => question.isDemo),
      questions: selected.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        choices: question.choices as unknown as string[],
      })),
    };
  }

  async submit(userId: string, dto: SubmitQuizDto) {
    const requiredCount = questionCount(dto.mode);
    if (dto.answers.length !== requiredCount) throw new BadRequestException(`${requiredCount}문항을 모두 제출해 주세요.`);
    if (new Set(dto.answers.map((answer) => answer.questionId)).size !== dto.answers.length) {
      throw new BadRequestException('중복된 문항 답안이 포함되어 있습니다.');
    }
    const questions = await this.prisma.question.findMany({ where: { id: { in: dto.answers.map((answer) => answer.questionId) }, licenseType: dto.licenseType } });
    if (questions.length !== dto.answers.length) throw new BadRequestException('유효하지 않은 문항이 포함되어 있습니다.');
    const scored = scoreAnswers(questions, dto.answers);
    const score = scored.filter((answer) => answer.isCorrect).length;

    const attempt = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.quizAttempt.create({
        data: {
          userId,
          licenseType: dto.licenseType,
          mode: dto.mode,
          score,
          total: scored.length,
          durationSec: dto.durationSec,
          answers: { create: scored.map((answer) => ({ questionId: answer.question.id, selectedIndex: answer.selectedIndex, isCorrect: answer.isCorrect })) },
        },
      });
      await Promise.all(scored.map((answer) => answer.isCorrect
        ? transaction.wrongAnswer.deleteMany({ where: { userId, questionId: answer.question.id } })
        : transaction.wrongAnswer.upsert({
          where: { userId_questionId: { userId, questionId: answer.question.id } },
          update: {},
          create: { userId, questionId: answer.question.id },
        }),
      ));
      return created;
    });

    return {
      attemptId: attempt.id,
      score,
      total: scored.length,
      answers: scored.map((answer) => ({
        questionId: answer.question.id,
        selectedIndex: answer.selectedIndex,
        correctIndex: answer.question.answerIndex,
        isCorrect: answer.isCorrect,
        explanation: answer.question.explanation,
      })),
    };
  }

  async wrongAnswers(userId: string) {
    const answers = await this.prisma.wrongAnswer.findMany({
      where: { userId },
      include: { question: true },
      orderBy: { updatedAt: 'desc' },
    });
    return answers.map(({ question, updatedAt }) => ({
      id: question.id,
      prompt: question.prompt,
      choices: question.choices as unknown as string[],
      correctIndex: question.answerIndex,
      explanation: question.explanation,
      updatedAt,
    }));
  }
}
