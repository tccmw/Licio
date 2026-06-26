import { create } from 'zustand';
import { LicenseType, QuizMode, QuizQuestion } from '../types/domain';

type QuizState = {
  questions: QuizQuestion[];
  answers: Record<string, number>;
  licenseType: LicenseType;
  mode: QuizMode;
  startedAt?: number;
  start: (questions: QuizQuestion[], licenseType: LicenseType, mode: QuizMode) => void;
  answer: (questionId: string, selectedIndex: number) => void;
  reset: () => void;
};

const initial = { questions: [], answers: {}, licenseType: 'SECOND_NORMAL' as LicenseType, mode: 'QUICK' as QuizMode, startedAt: undefined };

// 진행 중인 시험 상태는 앱 실행 중에만 유지한다. 결과/오답은 제출 후 서버 동기화 대상이다.
export const useQuizStore = create<QuizState>((set) => ({
  ...initial,
  start: (questions, licenseType, mode) => set({ questions, licenseType, mode, answers: {}, startedAt: Date.now() }),
  answer: (questionId, selectedIndex) => set((state) => ({ answers: { ...state.answers, [questionId]: selectedIndex } })),
  reset: () => set(initial),
}));
