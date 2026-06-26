import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { LicenseType, QuizMode } from '../types/domain';

type QuizPreferenceState = {
  licenseType: LicenseType;
  mode: QuizMode;
  setLicenseType: (licenseType: LicenseType) => void;
  setMode: (mode: QuizMode) => void;
};

export const useQuizPreferenceStore = create<QuizPreferenceState>()(
  persist(
    (set) => ({
      licenseType: 'SECOND_NORMAL',
      mode: 'QUICK',
      setLicenseType: (licenseType) => set({ licenseType }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'licio.quiz-preferences.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ licenseType, mode }) => ({ licenseType, mode }),
    },
  ),
);
