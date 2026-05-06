import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Memo, formatDate, CATEGORY_EMOJI } from '@/lib/mock-data';

export function MemoCard({ memo }: { memo: Memo }) {
  const emoji = CATEGORY_EMOJI[memo.category_name] ?? '📝';
  return (
    <Pressable className="bg-white rounded-2xl px-4 py-3.5 mb-3 border border-gray-100 active:bg-gray-50">
      <View className="flex-row items-center mb-1.5">
        <Text className="text-lg mr-2">{emoji}</Text>
        <Text className="text-xs font-semibold text-brand-600">{memo.category_name}</Text>
        {memo.alarm_date ? (
          <View className="ml-auto bg-amber-50 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] text-amber-700 font-medium">
              🔔 {formatDate(memo.alarm_date)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text className="text-[15px] text-gray-900 leading-5" numberOfLines={2}>
        {memo.memo}
      </Text>
      <View className="flex-row flex-wrap items-center mt-2">
        {memo.tag.map((t) => (
          <View key={t} className="bg-gray-100 px-2 py-0.5 rounded-full mr-1.5 mb-1">
            <Text className="text-[11px] text-gray-600">#{t}</Text>
          </View>
        ))}
        <Text className="text-[11px] text-gray-400 ml-auto">{formatDate(memo.createDate)}</Text>
      </View>
    </Pressable>
  );
}
