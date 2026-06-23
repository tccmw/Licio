import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/theme';
import { useAuthStore } from '../store/auth.store';
import { AcademyScreen } from '../screens/AcademyScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { QuizPlayScreen } from '../screens/QuizPlayScreen';
import { QuizResultScreen } from '../screens/QuizResultScreen';
import { QuizSetupScreen } from '../screens/QuizSetupScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { QuizResult } from '../types/domain';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Home: undefined;
  Academies: undefined;
  QuizSetup: undefined;
  QuizPlay: undefined;
  QuizResult: { result: QuizResult };
  Schedule: undefined;
  Auth: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => { void hydrate(); }, [hydrate]);
  return <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { fontWeight: '800', color: colors.ink }, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Academies" component={AcademyScreen} options={{ title: '주변 운전학원' }} />
    <Stack.Screen name="QuizSetup" component={QuizSetupScreen} options={{ title: '모의시험' }} />
    <Stack.Screen name="QuizPlay" component={QuizPlayScreen} options={{ title: '시험 진행' }} />
    <Stack.Screen name="QuizResult" component={QuizResultScreen} options={{ title: '결과' }} />
    <Stack.Screen name="Schedule" component={ScheduleScreen} options={{ title: '시험 일정' }} />
    <Stack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal', headerShown: false }} />
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '내 학습' }} />
  </Stack.Navigator>;
}
