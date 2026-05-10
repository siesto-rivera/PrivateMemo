import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { MemoCard } from '@/components/memo-card';
import { getMemos } from '@/lib/api';
import { syncAlarms } from '@/lib/notifications';
import type { Memo } from '@/lib/types';

export default function AlarmsScreen() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getMemos();
      setMemos(data);
      syncAlarms(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '메모를 불러오지 못했습니다');
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // 일회성 알람(repeat=none)이 이미 지난 경우 숨김. 반복 알람은 계속 표시.
  const now = Date.now();
  const alarms = memos
    .filter((m) => {
      if (!m.alarm_date) return false;
      const isRecurring = m.repeat && m.repeat !== 'none';
      if (isRecurring) return true;
      return new Date(m.alarm_date).getTime() >= now;
    })
    .sort((a, b) => (a.alarm_date ?? '').localeCompare(b.alarm_date ?? ''));

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="예정된 알림" subtitle={`${alarms.length}건의 알림`} />
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View className="items-center py-16">
            <Text className="text-sm text-gray-400">로딩 중…</Text>
          </View>
        ) : error ? (
          <View className="items-center py-16">
            <Text className="text-sm text-red-500">{error}</Text>
          </View>
        ) : alarms.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-3xl mb-2">🔕</Text>
            <Text className="text-sm text-gray-400">예약된 알림이 없습니다</Text>
          </View>
        ) : (
          alarms.map((m) => <MemoCard key={String(m.id)} memo={m} onChanged={load} />)
        )}
      </ScrollView>
    </View>
  );
}
