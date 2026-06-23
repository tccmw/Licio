const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Licio',
  slug: 'licio',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'licio',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/licio-logo.png',
    resizeMode: 'contain',
    backgroundColor: '#F8FAFC',
  },
  android: {
    package: 'com.licio.app',
    adaptiveIcon: { backgroundColor: '#2563EB' },
    ...(googleMapsApiKey ? { config: { googleMaps: { apiKey: googleMapsApiKey } } } : {}),
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  plugins: [
    ['expo-location', { locationWhenInUsePermission: 'Licio가 가까운 운전학원을 찾기 위해 위치를 사용합니다.' }],
    'expo-secure-store',
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    kakaoRestApiKey: process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY,
  },
};
