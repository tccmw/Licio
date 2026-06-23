import { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <SafeAreaView style={[styles.screen, style]} edges={['top', 'bottom']}><View style={styles.content}>{children}</View></SafeAreaView>;
}

export function PrimaryButton({ title, onPress, disabled, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, disabled && styles.disabled]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
  </Pressable>;
}

export function Loading({ label = '불러오는 중…' }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{label}</Text></View>;
}

export function Notice({ children }: PropsWithChildren) {
  return <View style={styles.notice}><Text style={styles.noticeText}>{children}</Text></View>;
}

export const ui = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  subtitle: { marginTop: spacing.sm, color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: spacing.md, borderWidth: 1, borderColor: colors.line },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  muted: { color: colors.muted },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  button: { minHeight: 52, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  secondaryButton: { backgroundColor: '#E0F2FE' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryText: { color: colors.primary },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  muted: { color: colors.muted },
  notice: { backgroundColor: '#ECFEFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#A5F3FC' },
  noticeText: { color: '#155E75', fontSize: 13, lineHeight: 19 },
});
