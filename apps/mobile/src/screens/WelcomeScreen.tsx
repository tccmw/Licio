import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, PrimaryButton, ui } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useLocationStore } from '../store/location.store';
import { useOnboardingStore } from '../store/onboarding.store';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const REGIONS = [
  { label: '서울', latitude: 37.5665, longitude: 126.978 },
  { label: '경기', latitude: 37.4138, longitude: 127.5183 },
  { label: '부산', latitude: 35.1796, longitude: 129.0756 },
  { label: '대구', latitude: 35.8714, longitude: 128.6014 },
];

export function WelcomeScreen({ navigation }: Props) {
  const setLocation = useLocationStore((state) => state.setLocation);
  const setRequested = useOnboardingStore((state) => state.setLocationRequested);
  const setManualRegion = useOnboardingStore((state) => state.setManualRegion);

  const continueWithLocation = async () => {
    setRequested();
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status === 'granted') {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, label: '현재 위치', isDeviceLocation: true });
    }
    navigation.replace('Home');
  };

  const chooseRegion = (region: typeof REGIONS[number]) => {
    setRequested();
    setManualRegion(region.label);
    setLocation({ ...region, label: `${region.label} 중심`, isDeviceLocation: false });
    navigation.replace('Home');
  };

  return <Screen style={styles.screen}>
    <View style={styles.hero}><Text style={styles.mark}>L</Text><Text style={ui.title}>면허 준비를 한 곳에서</Text><Text style={ui.subtitle}>가까운 학원, 모의시험, 시험 일정을 Licio에서 확인하세요.</Text></View>
    <View style={styles.locationCard}><Text style={styles.cardTitle}>내 주변 학원을 찾을까요?</Text><Text style={ui.subtitle}>위치는 가까운 학원을 찾을 때만 사용하며 저장하지 않습니다.</Text><View style={styles.gap} /><PrimaryButton title="위치 정보 허용" onPress={() => void continueWithLocation()} /></View>
    <Text style={styles.manualTitle}>위치를 허용하지 않고 지역 선택</Text>
    <View style={styles.regionGrid}>{REGIONS.map((region) => <Pressable key={region.label} style={styles.region} onPress={() => chooseRegion(region)}><Text style={styles.regionText}>{region.label}</Text></Pressable>)}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { padding: spacing.lg },
  hero: { marginTop: 64, gap: spacing.sm },
  mark: { backgroundColor: colors.primary, color: '#fff', width: 48, height: 48, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', borderRadius: 14, fontSize: 25, fontWeight: '900', marginBottom: spacing.md },
  locationCard: { ...ui.card, marginTop: 48 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  gap: { height: spacing.lg },
  manualTitle: { color: colors.muted, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  region: { width: '47%', backgroundColor: '#E0F2FE', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  regionText: { color: colors.primary, fontWeight: '800' },
});
