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

export const useQuizStore = create<QuizState>((set) => ({
  ...initial,
  start: (questions, licenseType, mode) => set({ questions, licenseType, mode, answers: {}, startedAt: Date.now() }),
  answer: (questionId, selectedIndex) => set((state) => ({ answers: { ...state.answers, [questionId]: selectedIndex } })),
  reset: () => set(initial),
}));
