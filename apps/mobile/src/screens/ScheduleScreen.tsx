import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Notice, Screen, ui } from '../components/ui';
import { colors, spacing } from '../constants/theme';
import { api } from '../lib/api';
import { LicenseType } from '../types/domain';
import { useAuthStore } from '../store/auth.store';

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const monthRange = (month: Date) => ({ from: isoDate(new Date(month.getFullYear(), month.getMonth(), 1)), to: isoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0)) });
const asDate = (value: string | Date) => new Date(value);

export function ScheduleScreen() {
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => new Date());
  const [licenseType, setLicenseType] = useState<LicenseType>('SECOND_NORMAL');
  const [selected, setSelected] = useState(isoDate(new Date()));
  const range = monthRange(month);
  const { data, isLoading, isError } = useQuery({ queryKey: ['exams', range.from, range.to, licenseType], queryFn: () => api.exams(range.from, range.to, licenseType) });
  const { data: favorites = [] } = useQuery({ queryKey: ['favorites'], queryFn: () => api.favorites(session!), enabled: Boolean(session) });
  const favoriteMutation = useMutation({
    mutationFn: async (schedule: { centerId: string; centerName: string }) => {
      const exists = favorites.some((item) => item.type === 'EXAM_CENTER' && item.targetId === schedule.centerId);
      return exists ? api.removeFavorite(session!, 'EXAM_CENTER', schedule.centerId) : api.addFavorite(session!, 'EXAM_CENTER', schedule.centerId, schedule.centerName);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });
  const markedDates = useMemo(() => {
    const marked: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> = {};
    data?.schedules.forEach((schedule) => { marked[isoDate(asDate(schedule.startsAt))] = { marked: true, dotColor: colors.accent }; });
    marked[selected] = { ...(marked[selected] ?? {}), selected: true, selectedColor: colors.primary };
    return marked;
  }, [data?.schedules, selected]);
  const daySchedules = data?.schedules.filter((schedule) => isoDate(asDate(schedule.startsAt)) === selected) ?? [];

  return <Screen><ScrollView contentContainerStyle={styles.content}><Text style={ui.subtitle}>시험 날짜를 선택하면 상세 일정과 공식 접수 페이지를 확인할 수 있습니다.</Text><View style={styles.filters}>{([['FIRST_NORMAL', '1종 보통'], ['SECOND_NORMAL', '2종 보통']] as const).map(([value, label]) => <Pressable key={value} onPress={() => setLicenseType(value)} style={[styles.filter, value === licenseType && styles.filterSelected]}><Text style={[styles.filterText, value === licenseType && styles.filterTextSelected]}>{label}</Text></Pressable>)}</View>
    <View style={styles.calendarCard}><Calendar current={isoDate(month)} markedDates={markedDates} onDayPress={(day) => setSelected(day.dateString)} onMonthChange={(date) => setMonth(new Date(`${date.dateString}T12:00:00`))} theme={{ todayTextColor: colors.secondary, arrowColor: colors.primary, selectedDayBackgroundColor: colors.primary, dotColor: colors.accent }} /></View>
    {data?.source === 'demo' && <Notice>데모 일정입니다. 실제 접수 전 도로교통공단 공식 사이트에서 반드시 확인하세요.</Notice>}
    {isLoading && <Text style={ui.muted}>시험 일정을 불러오는 중…</Text>}{isError && <Notice>일정을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</Notice>}
    <Text style={ui.sectionTitle}>{selected} 일정</Text>{daySchedules.length === 0 && <Text style={ui.muted}>선택한 날짜에 표시할 일정이 없습니다.</Text>}{daySchedules.map((schedule) => { const favorite = favorites.some((item) => item.type === 'EXAM_CENTER' && item.targetId === schedule.centerId); return <View key={schedule.providerId} style={ui.card}><Text style={styles.center}>{schedule.centerName}</Text><Text style={styles.detail}>{schedule.category} · {asDate(schedule.startsAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</Text><View style={styles.scheduleActions}>{session && <Pressable disabled={favoriteMutation.isPending} onPress={() => favoriteMutation.mutate(schedule)}><Text style={styles.favorite}>{favorite ? '♥ 관심 시험장' : '♡ 관심 시험장'}</Text></Pressable>}<Pressable onPress={() => void Linking.openURL(schedule.bookingUrl)}><Text style={styles.booking}>공식 접수 페이지 열기 ↗</Text></Pressable></View></View>; })}
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  filters: { flexDirection: 'row', gap: spacing.sm },
  filter: { flex: 1, padding: 11, alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 10, backgroundColor: '#fff' },
  filterSelected: { backgroundColor: '#EFF6FF', borderColor: colors.primary },
  filterText: { color: colors.muted, fontWeight: '800' },
  filterTextSelected: { color: colors.primary },
  calendarCard: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  center: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  detail: { color: colors.muted, marginTop: spacing.xs },
  booking: { color: colors.primary, fontWeight: '800', marginTop: spacing.md },
  scheduleActions: { marginTop: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  favorite: { color: colors.danger, fontWeight: '800' },
});
