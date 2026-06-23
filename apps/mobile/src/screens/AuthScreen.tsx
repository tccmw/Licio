import { useCallback, useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Notice, PrimaryButton, Screen, ui } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { api } from '../lib/api';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/auth.store';

WebBrowser.maybeCompleteAuthSession();

const kakaoDiscovery = { authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize' };

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;
type SocialProvider = 'GOOGLE' | 'KAKAO';
type SignInPayload = { provider: SocialProvider; accessToken: string; idToken?: string };

type ProviderButtonProps = {
  onComplete: (payload: SignInPayload) => Promise<void>;
  onError: (message: string) => void;
};

function GoogleLoginButton({ onComplete, onError }: ProviderButtonProps) {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!;
  const [request, response, prompt] = Google.useAuthRequest({ androidClientId: clientId, scopes: ['openid', 'profile', 'email'] });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const accessToken = response.authentication?.accessToken;
    if (!accessToken) {
      onError('Google access token을 받지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    void onComplete({ provider: 'GOOGLE', accessToken, idToken: response.params.id_token });
  }, [onComplete, onError, response]);

  return <PrimaryButton title="Google로 계속하기" disabled={!request} onPress={() => void prompt()} />;
}

function KakaoLoginButton({ onComplete, onError }: ProviderButtonProps) {
  const clientId = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY!;
  const [request, response, prompt] = AuthSession.useAuthRequest({
    clientId,
    redirectUri: AuthSession.makeRedirectUri({ scheme: 'licio' }),
    responseType: AuthSession.ResponseType.Token,
  }, kakaoDiscovery);

  useEffect(() => {
    if (response?.type !== 'success') return;
    const accessToken = response.params.access_token;
    if (!accessToken) {
      onError('Kakao access token을 받지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    void onComplete({ provider: 'KAKAO', accessToken });
  }, [onComplete, onError, response]);

  return <PrimaryButton title="Kakao로 계속하기" secondary disabled={!request} onPress={() => void prompt()} />;
}

export function AuthScreen({ navigation }: Props) {
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string>();
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const kakaoClientId = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

  const completeSignIn = useCallback(async ({ provider, accessToken, idToken }: SignInPayload) => {
    try {
      setError(undefined);
      await setSession(await api.signIn(provider, accessToken, idToken));
      navigation.replace('Profile');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '로그인에 실패했습니다. 다시 시도해 주세요.');
    }
  }, [navigation, setSession]);
  const showProviderError = useCallback((message: string) => setError(message), []);

  return <Screen style={styles.screen}>
    <Pressable accessibilityRole="button" style={styles.closeButton} onPress={() => navigation.goBack()}><Text style={styles.closeText}>닫기</Text></Pressable>
    <View style={styles.top}>
      <Text style={ui.title}>로그인하고{`\n`}학습 기록을 이어가세요</Text>
      <Text style={ui.subtitle}>시험 결과, 오답 노트, 관심 학원과 시험장을 계정에 동기화합니다.</Text>
    </View>
    <View style={styles.buttons}>
      {googleClientId ? <GoogleLoginButton onComplete={completeSignIn} onError={showProviderError} /> : <PrimaryButton title="Google 로그인 설정 필요" disabled onPress={() => undefined} />}
      {kakaoClientId ? <KakaoLoginButton onComplete={completeSignIn} onError={showProviderError} /> : <PrimaryButton title="Kakao 로그인 설정 필요" secondary disabled onPress={() => undefined} />}
    </View>
    {(!googleClientId || !kakaoClientId) && <Notice>소셜 로그인은 개발 환경 변수에 해당 클라이언트 ID를 설정한 뒤 사용할 수 있습니다.</Notice>}
    {error && <Text style={styles.error}>{error}</Text>}
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md },
  closeButton: { alignSelf: 'flex-end', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  closeText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  top: { marginTop: 48 },
  buttons: { marginTop: 48, gap: spacing.sm },
  error: { color: colors.danger, marginTop: spacing.md },
});
