import { create } from 'zustand';

type OnboardingState = {
  locationRequested: boolean;
  manualRegion?: string;
  setLocationRequested: () => void;
  setManualRegion: (region: string) => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  locationRequested: false,
  setLocationRequested: () => set({ locationRequested: true }),
  setManualRegion: (manualRegion) => set({ manualRegion }),
}));
