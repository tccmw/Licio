import { useCallback, useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { api, SocialSignInRequest } from '../lib/api';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../store/auth.store';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;
type LoginButtonKind = 'google' | 'kakao';

type ProviderButtonProps = {
  onComplete: (payload: SocialSignInRequest) => Promise<void>;
  onError: (message: string) => void;
};

type SocialLoginButtonProps = {
  title: string;
  kind: LoginButtonKind;
  disabled?: boolean;
  onPress: () => void;
};

function SocialLoginButton({ title, kind, disabled, onPress }: SocialLoginButtonProps) {
  const isKakao = kind === 'kakao';
  if (isKakao) {
    return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={[styles.kakaoImageButton, disabled && styles.disabledButton]}>
      <Image source={require('../../assets/kakao_login_medium_narrow.png')} resizeMode="contain" style={styles.kakaoImage} />
    </Pressable>;
  }

  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={[styles.googleButton, disabled && styles.disabledButton]}>
    <Image source={require('../../assets/google-g-logo.png')} resizeMode="contain" style={styles.googleLogo} />
    <Text style={styles.googleLabel}>Google 계정으로 로그인</Text>
  </Pressable>;
}

function GoogleLoginButton({ onComplete, onError }: ProviderButtonProps) {
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const iosRedirectScheme = iosClientId?.endsWith('.apps.googleusercontent.com')
    ? `com.googleusercontent.apps.${iosClientId.slice(0, -'.apps.googleusercontent.com'.length)}`
    : undefined;
  const [request, response, prompt] = Google.useAuthRequest({
    androidClientId,
    iosClientId,
    redirectUri: Platform.OS === 'ios' && iosRedirectScheme ? `${iosRedirectScheme}:/oauthredirect` : undefined,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'error') {
      onError(response.error?.message ?? 'Google 로그인 요청을 완료하지 못했습니다.');
      return;
    }
    if (response?.type !== 'success') return;
    const accessToken = response.authentication?.accessToken;
    const idToken = response.authentication?.idToken ?? response.params.id_token;
    if (!accessToken && !idToken) {
      onError('Google 인증 토큰을 받지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    void onComplete({ provider: 'GOOGLE', accessToken, idToken });
  }, [onComplete, onError, response]);

  return <SocialLoginButton kind="google" title="Google로 계속하기" disabled={!request} onPress={() => void prompt()} />;
}

function KakaoLoginButton({ onComplete, onError }: ProviderButtonProps) {
  const [pending, setPending] = useState(false);

  const signIn = async () => {
    if (pending) return;
    try {
      setPending(true);
      const { login } = await import('@react-native-kakao/user');
      const token = await login();
      await onComplete({ provider: 'KAKAO', accessToken: token.accessToken, idToken: token.idToken });
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'Kakao 로그인 요청을 완료하지 못했습니다.');
    } finally {
      setPending(false);
    }
  };

  return <SocialLoginButton kind="kakao" title="카카오로 3초 만에 시작하기" disabled={pending} onPress={() => void signIn()} />;
}

function AppleLoginButton({ onComplete, onError }: ProviderButtonProps) {
  const [pending, setPending] = useState(false);

  const signIn = async () => {
    try {
      setPending(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        onError('Apple 인증 토큰을 받지 못했습니다. 다시 시도해 주세요.');
        return;
      }
      await onComplete({ provider: 'APPLE', idToken: credential.identityToken });
    } catch (reason) {
      if ((reason as { code?: string }).code !== 'ERR_REQUEST_CANCELED') {
        onError('Apple 로그인 요청을 완료하지 못했습니다.');
      }
    } finally {
      setPending(false);
    }
  };

  return <AppleAuthentication.AppleAuthenticationButton
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    cornerRadius={12}
    style={[styles.appleButton, pending && styles.disabledButton]}
    onPress={() => void signIn()}
  />;
}

export function AuthScreen({ navigation }: Props) {
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string>();
  const googleClientId = Platform.select({
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  const kakaoClientId = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

  const completeSignIn = useCallback(async (payload: SocialSignInRequest) => {
    try {
      setError(undefined);
      await setSession(await api.signIn(payload));
      navigation.replace('Profile');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '로그인에 실패했습니다. 다시 시도해 주세요.');
    }
  }, [navigation, setSession]);
  const showProviderError = useCallback((message: string) => setError(message), []);

  return <Screen style={styles.screen}>
    <ScrollView contentContainerStyle={styles.layout} showsVerticalScrollIndicator={false} bounces={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="로그인 닫기" style={styles.closeButton} onPress={() => navigation.goBack()}><Text style={styles.closeText}>×</Text></Pressable>

      <View style={styles.brand}>
        <View style={styles.logoCard}><Image source={require('../../assets/licio-logo.png')} style={styles.logo} accessibilityLabel="Licio 로고" /></View>
        <Text style={styles.wordmark}>Licio</Text>
        <Text style={styles.brandTagline}>운전 면허를 한눈에</Text>
      </View>

      <View style={styles.loginSection}>
        <View style={styles.buttons}>
          {kakaoClientId ? <KakaoLoginButton onComplete={completeSignIn} onError={showProviderError} /> : <SocialLoginButton kind="kakao" title="카카오 로그인 준비 중" disabled onPress={() => undefined} />}
          {googleClientId ? <GoogleLoginButton onComplete={completeSignIn} onError={showProviderError} /> : <SocialLoginButton kind="google" title="Google 로그인 준비 중" disabled onPress={() => undefined} />}
          {Platform.OS === 'ios' && <AppleLoginButton onComplete={completeSignIn} onError={showProviderError} />}
        </View>
        {(!googleClientId || !kakaoClientId) && <Text style={styles.setupText}>소셜 로그인 설정을 준비하고 있습니다.</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.footer}>
        <View style={styles.terms}><Text style={styles.term}>서비스 이용약관</Text><Text style={styles.dot}>·</Text><Text style={styles.term}>개인정보 처리방침</Text></View>
        <Text style={styles.copyright}>Licio는 운전면허 준비를 더 쉽게 만듭니다.</Text>
      </View>
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, paddingHorizontal: 28 },
  layout: { flexGrow: 1 },
  closeButton: { alignItems: 'center', justifyContent: 'center', height: 40, left: -8, position: 'absolute', top: spacing.md, width: 40, zIndex: 1 },
  closeText: { color: colors.ink, fontSize: 28, fontWeight: '300', lineHeight: 30 },
  brand: { alignItems: 'center', marginTop: 150 },
  logoCard: { alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 30, height: 88, justifyContent: 'center', width: 88 },
  logo: { height: 74, width: 74 },
  wordmark: { color: colors.ink, fontSize: 26, fontWeight: '900', letterSpacing: -1, marginTop: spacing.sm },
  brandTagline: { color: colors.muted, fontSize: 14, fontWeight: '600', marginTop: spacing.xs },
  loginSection: { marginTop: 128 },
  buttons: { gap: 10 },
  kakaoImageButton: { alignSelf: 'center', height: 45, overflow: 'hidden', width: 183 },
  kakaoImage: { height: 45, width: 183 },
  googleButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#747775', borderRadius: 12, borderWidth: 1, flexDirection: 'row', height: 52, overflow: 'hidden', paddingLeft: 12, paddingRight: 12, width: '100%' },
  googleLogo: { height: 18, marginRight: 10, width: 18 },
  googleLabel: { color: '#1F1F1F', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  appleButton: { height: 52, width: '100%' },
  disabledButton: { opacity: 0.45 },
  setupText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.sm, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: spacing.sm, textAlign: 'center' },
  footer: { alignItems: 'center', marginTop: 'auto', paddingBottom: 42 },
  terms: { flexDirection: 'row', gap: spacing.sm },
  term: { color: colors.muted, fontSize: 11 },
  dot: { color: '#CBD5E1', fontSize: 11 },
  copyright: { color: '#94A3B8', fontSize: 10, marginTop: spacing.sm },
});
