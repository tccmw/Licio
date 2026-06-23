import { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Welcome'), 1400);
    return () => clearTimeout(timer);
  }, [navigation]);

  return <View style={styles.screen}>
    <Image source={require('../../assets/licio-logo.png')} style={styles.logo} accessibilityLabel="Licio 로고" />
    <Text style={styles.wordmark}>Licio</Text>
    <Text style={styles.tagline}>면허 준비를 한 곳에서</Text>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  logo: { width: 176, height: 176 },
  wordmark: { color: colors.ink, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: spacing.lg },
  tagline: { color: colors.muted, fontSize: 15, marginTop: spacing.sm },
});
