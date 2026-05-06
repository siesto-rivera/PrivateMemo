import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ScreenHeader } from '@/components/screen-header';
import { MemoCard } from '@/components/memo-card';
import { MOCK_MEMOS } from '@/lib/mock-data';

export default function AlarmsScreen() {
  const alarms = MOCK_MEMOS.filter((m) => !!m.alarm_date).sort((a, b) =>
    (a.alarm_date ?? '').localeCompare(b.alarm_date ?? ''),
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="예정된 알림" subtitle={`${alarms.length}건의 알림`} />
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {alarms.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-3xl mb-2">🔕</Text>
            <Text className="text-sm text-gray-400">예약된 알림이 없습니다</Text>
          </View>
        ) : (
          alarms.map((m) => <MemoCard key={m.id} memo={m} />)
        )}
      </ScrollView>
    </View>
  );
}
