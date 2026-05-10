import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import { ScreenHeader } from '@/components/screen-header';
import { MemoCard } from '@/components/memo-card';
import { getMemos } from '@/lib/api';
import type { Memo } from '@/lib/types';


LocaleConfig.locales['ko'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

const BRAND = '#7c3aed';


function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const KO_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatScheduleDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${dateStr.replace(/-/g, '.')} (${KO_DAYS[d.getDay()]})`;
}


export default function CalendarScreen() {
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selected, setSelected] = useState<string>(todayStr());
  const [currentMonth, setCurrentMonth] = useState<string>(() => todayStr().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'annual'>('calendar');

  const load = useCallback(async () => {
    try {
      const data = await getMemos();
      setMemos(data);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await load();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  const scheduledMemos = useMemo(
    () => memos.filter((m) => !!m.schedule_date),
    [memos],
  );

  const markedDates = useMemo(() => {
    const m: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }> = {};
    for (const memo of scheduledMemos) {
      const d = memo.schedule_date as string;
      m[d] = { marked: true, dotColor: BRAND };
    }
    m[selected] = {
      ...(m[selected] ?? {}),
      marked: m[selected]?.marked ?? false,
      dotColor: m[selected]?.dotColor ?? BRAND,
      selected: true,
      selectedColor: BRAND,
    };
    return m;
  }, [scheduledMemos, selected]);

  const monthMemos = scheduledMemos
    .filter((m) => (m.schedule_date ?? '').startsWith(currentMonth))
    .sort((a, b) => (a.schedule_date ?? '').localeCompare(b.schedule_date ?? ''));
  const listTitle = `${currentMonth.replace('-', '년 ')}월 일정 ${monthMemos.length}건`;

  const today = todayStr();
  const annualMemos = useMemo(
    () =>
      scheduledMemos
        .filter((m) => (m.schedule_date ?? '') >= today)
        .sort((a, b) => (a.schedule_date ?? '').localeCompare(b.schedule_date ?? '')),
    [scheduledMemos, today],
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title="일정"
        subtitle={`${scheduledMemos.length}개의 일정`}
        right={
          <Pressable
            onPress={() => router.push('/add?from=calendar')}
            hitSlop={8}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 4,
              elevation: 3,
            }}
            className="bg-white px-4 py-2 rounded-full active:bg-gray-100 flex-row items-center"
          >
            <Text className="text-base text-brand-600 font-bold leading-none mr-1">＋</Text>
            <Text className="text-xs text-brand-600 font-bold leading-none">새 메모</Text>
          </Pressable>
        }
      />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 pt-4 pb-2 items-center">
          <View className="flex-row bg-white rounded-full p-1 border border-gray-200">
            <Pressable
              onPress={() => setViewMode('calendar')}
              className={`px-4 py-1.5 rounded-full ${
                viewMode === 'calendar' ? 'bg-brand-500' : ''
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  viewMode === 'calendar' ? 'text-white' : 'text-gray-600'
                }`}
              >
                📅 캘린더
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('annual')}
              className={`px-4 py-1.5 rounded-full ${
                viewMode === 'annual' ? 'bg-brand-500' : ''
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  viewMode === 'annual' ? 'text-white' : 'text-gray-600'
                }`}
              >
                📋 연간일정
              </Text>
            </Pressable>
          </View>
        </View>

        {viewMode === 'calendar' ? (
          <>
            <View className="bg-white border-b border-gray-100">
              <Calendar
                current={selected}
                onDayPress={(day) => {
                  setSelected(day.dateString);
                  setCurrentMonth(day.dateString.slice(0, 7));
                }}
                onMonthChange={(m) => {
                  const ym = `${m.year}-${String(m.month).padStart(2, '0')}`;
                  setCurrentMonth(ym);
                }}
                markedDates={markedDates}
                theme={{
                  todayTextColor: BRAND,
                  arrowColor: BRAND,
                  selectedDayBackgroundColor: BRAND,
                  dotColor: BRAND,
                }}
              />
            </View>

            <View className="px-5 pt-4">
              <Text className="text-xs font-semibold text-gray-500 mb-3 ml-1">{listTitle}</Text>
              {loading ? (
                <Text className="text-sm text-gray-400 py-8 text-center">로딩 중…</Text>
              ) : monthMemos.length === 0 ? (
                <View className="items-center py-12">
                  <Text className="text-3xl mb-2">📅</Text>
                  <Text className="text-sm text-gray-400">이 달 일정이 없습니다</Text>
                </View>
              ) : (
                monthMemos.map((m) => (
                  <MemoCard
                    key={String(m.id)}
                    memo={m}
                    onChanged={load}
                    highlighted={m.schedule_date === selected}
                  />
                ))
              )}
            </View>
          </>
        ) : (
          <View className="px-5 pt-2">
            <Text className="text-xs font-semibold text-gray-500 mb-3 ml-1">
              오늘 이후 일정 {annualMemos.length}건
            </Text>
            {loading ? (
              <Text className="text-sm text-gray-400 py-8 text-center">로딩 중…</Text>
            ) : annualMemos.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-3xl mb-2">📅</Text>
                <Text className="text-sm text-gray-400">예정된 일정이 없습니다</Text>
              </View>
            ) : (
              annualMemos.map((m) => (
                <View key={String(m.id)} className="mb-1">
                  <Text className="text-xs font-bold text-brand-700 mb-1.5 ml-1">
                    {formatScheduleDate(m.schedule_date as string)}
                  </Text>
                  <MemoCard memo={m} onChanged={load} />
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
