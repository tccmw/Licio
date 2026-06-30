const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
const allowInsecureIosHttp = process.env.EXPO_IOS_ALLOW_INSECURE_HTTP === 'true';
const googleIosScheme = googleIosClientId?.endsWith('.apps.googleusercontent.com')
  ? `com.googleusercontent.apps.${googleIosClientId.slice(0, -'.apps.googleusercontent.com'.length)}`
  : undefined;
const locationPermission = 'Licio가 가까운 운전학원을 찾기 위해 현재 위치를 사용합니다.';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'Licio',
  slug: 'licio',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: ['licio', 'com.licio.app', googleIosScheme].filter(Boolean),
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
  ios: {
    bundleIdentifier: 'com.licio.app',
    supportsTablet: false,
    usesAppleSignIn: true,
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: locationPermission,
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
        ...(allowInsecureIosHttp ? { NSAllowsArbitraryLoads: true } : {}),
      },
    },
  },
  plugins: [
    ['expo-location', { locationWhenInUsePermission: locationPermission }],
    'expo-secure-store',
    'expo-apple-authentication',
    ...(kakaoNativeAppKey ? [[
      '@react-native-kakao/core',
      {
        nativeAppKey: kakaoNativeAppKey,
        android: { authCodeHandlerActivity: true },
        ios: { handleKakaoOpenUrl: true },
      },
    ]] : []),
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    googleIosClientId,
    kakaoNativeAppKey,
  },
};
