import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { ScreenHeader } from '@/components/screen-header';
import { MemoCard } from '@/components/memo-card';
import { MOCK_MEMOS } from '@/lib/mock-data';

export default function HomeScreen() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...MOCK_MEMOS].sort((a, b) =>
      b.createDate.localeCompare(a.createDate),
    );
    if (!q) return sorted;
    return sorted.filter(
      (m) =>
        m.memo.toLowerCase().includes(q) ||
        m.category_name.toLowerCase().includes(q) ||
        m.tag.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="지극히 사적인 메모장" subtitle={`총 ${MOCK_MEMOS.length}개의 메모`} />
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100 flex-row items-center">
          <Text className="text-base mr-2">🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="메모, 카테고리, 태그 검색"
            placeholderTextColor="#9ca3af"
            className="flex-1 text-[15px] text-gray-900"
          />
        </View>
        <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">최근 메모</Text>
        {filtered.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-3xl mb-2">🗒️</Text>
            <Text className="text-sm text-gray-400">검색 결과가 없습니다</Text>
          </View>
        ) : (
          filtered.map((m) => <MemoCard key={m.id} memo={m} />)
        )}
      </ScrollView>
    </View>
  );
}
