import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingState = {
  locationRequested: boolean;
  manualRegion?: string;
  setLocationRequested: () => void;
  setManualRegion: (region: string) => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      locationRequested: false,
      setLocationRequested: () => set({ locationRequested: true }),
      setManualRegion: (manualRegion) => set({ manualRegion }),
    }),
    {
      name: 'licio.onboarding.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ locationRequested, manualRegion }) => ({ locationRequested, manualRegion }),
    },
  ),
);
