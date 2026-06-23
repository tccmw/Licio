import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, Text, View } from 'react-native';
import { Notice, PrimaryButton, Screen, ui } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { api } from '../lib/api';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/auth.store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

WebBrowser.maybeCompleteAuthSession();

const kakaoDiscovery = { authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize' };

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string>();
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const kakaoClientId = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
  const [googleRequest, googleResponse, googlePrompt] = Google.useAuthRequest({ androidClientId: googleClientId, scopes: ['openid', 'profile', 'email'] });
  const [kakaoRequest, kakaoResponse, kakaoPrompt] = AuthSession.useAuthRequest({ clientId: kakaoClientId ?? '', redirectUri: AuthSession.makeRedirectUri({ scheme: 'licio' }), responseType: AuthSession.ResponseType.Token }, kakaoDiscovery);

  useEffect(() => {
    const complete = async () => {
      try {
        if (googleResponse?.type === 'success') {
          const accessToken = googleResponse.authentication?.accessToken;
          if (!accessToken) throw new Error('Google access token을 받지 못했습니다.');
          await setSession(await api.signIn('GOOGLE', accessToken, googleResponse.params.id_token));
          navigation.replace('Profile');
        }
        if (kakaoResponse?.type === 'success') {
          const accessToken = kakaoResponse.params.access_token;
          if (!accessToken) throw new Error('Kakao access token을 받지 못했습니다.');
          await setSession(await api.signIn('KAKAO', accessToken));
          navigation.replace('Profile');
        }
      } catch (reason) { setError(reason instanceof Error ? reason.message : '로그인에 실패했습니다.'); }
    };
    void complete();
  }, [googleResponse, kakaoResponse, navigation, setSession]);

  return <Screen style={styles.screen}><View style={styles.top}><Text style={ui.title}>로그인하고{`\n`}학습 기록을 이어가세요</Text><Text style={ui.subtitle}>시험 결과, 오답 노트, 관심 학원과 시험장을 계정에 동기화합니다.</Text></View><View style={styles.buttons}>
    <PrimaryButton title="Google로 계속하기" disabled={!googleRequest || !googleClientId} onPress={() => void googlePrompt()} />
    <PrimaryButton title="Kakao로 계속하기" secondary disabled={!kakaoRequest || !kakaoClientId} onPress={() => void kakaoPrompt()} />
  </View>{(!googleClientId || !kakaoClientId) && <Notice>소셜 로그인은 개발자 콘솔의 클라이언트 키와 API 서버 설정을 연결한 뒤 사용할 수 있습니다.</Notice>}{error && <Text style={styles.error}>{error}</Text>}</Screen>;
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md },
  top: { marginTop: 48 },
  buttons: { marginTop: 48, gap: spacing.sm },
  error: { color: colors.danger, marginTop: spacing.md },
});
