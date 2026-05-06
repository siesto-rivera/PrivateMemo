import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { MemoCard } from '@/components/memo-card';
import { getMemos } from '@/lib/api';
import type { Memo } from '@/lib/types';

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getMemos();
      setMemos(data);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...memos].sort((a, b) =>
      b.createDate.localeCompare(a.createDate),
    );
    if (!q) return sorted;
    return sorted.filter(
      (m) =>
        m.memo.toLowerCase().includes(q) ||
        m.category_name.toLowerCase().includes(q) ||
        m.tag.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query, memos]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="지극히 사적인 메모장" subtitle={`총 ${memos.length}개의 메모`} />
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
        {loading ? (
          <View className="items-center py-12">
            <Text className="text-sm text-gray-400">로딩 중…</Text>
          </View>
        ) : error ? (
          <View className="items-center py-12">
            <Text className="text-sm text-red-500">{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-3xl mb-2">🗒️</Text>
            <Text className="text-sm text-gray-400">
              {query ? '검색 결과가 없습니다' : '아직 메모가 없습니다'}
            </Text>
          </View>
        ) : (
          filtered.map((m) => <MemoCard key={String(m.id)} memo={m} onChanged={load} />)
        )}
      </ScrollView>
    </View>
  );
}
