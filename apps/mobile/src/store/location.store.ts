import { create } from 'zustand';

export type Coordinates = { latitude: number; longitude: number; label: string; isDeviceLocation: boolean };

type LocationState = Coordinates & { setLocation: (location: Coordinates) => void };

// 정확한 현재 위치는 앱 실행 중에만 사용하고 영구 저장하지 않는다.
export const useLocationStore = create<LocationState>((set) => ({
  latitude: 37.4979,
  longitude: 127.0276,
  label: '서울 강남구',
  isDeviceLocation: false,
  setLocation: (location) => set(location),
}));
