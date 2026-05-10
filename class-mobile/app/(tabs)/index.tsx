import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  RefreshControl,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { MemoCard } from '@/components/memo-card';
import { getMemos, getMemosPaginated } from '@/lib/api';
import { syncAlarms } from '@/lib/notifications';
import type { Memo } from '@/lib/types';

const PAGE_SIZE = 30;

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadInitial = useCallback(async () => {
    setError(null);
    try {
      const data = await getMemosPaginated(1, PAGE_SIZE);
      setMemos(data.results);
      setHasNext(data.has_next);
      setCount(data.count);
      setPage(1);
      // Sync alarms with full memo list (background, doesn't block UI).
      getMemos()
        .then((all) => syncAlarms(all))
        .catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : '메모를 불러오지 못했습니다');
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await getMemosPaginated(next, PAGE_SIZE);
      setMemos((prev) => [...prev, ...data.results]);
      setHasNext(data.has_next);
      setCount(data.count);
      setPage(next);
    } catch {
      // ignore — user can scroll again
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasNext, page]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await loadInitial();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [loadInitial]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return memos;
    return memos.filter(
      (m) =>
        m.memo.toLowerCase().includes(q) ||
        m.category_name.toLowerCase().includes(q) ||
        m.tag.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query, memos]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title="지극히 사적인 메모장"
        subtitle={`총 ${count}개의 메모`}
        right={
          <Pressable
            onPress={() => router.push('/add')}
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
      <FlatList
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={filtered}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => <MemoCard memo={item} />}
        onEndReached={query.trim() ? undefined : loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
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
            <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">
              {query.trim() ? `검색 결과 ${filtered.length}건` : '최근 메모'}
            </Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-12">
              <Text className="text-sm text-gray-400">로딩 중…</Text>
            </View>
          ) : error ? (
            <View className="items-center py-12">
              <Text className="text-sm text-red-500">{error}</Text>
            </View>
          ) : (
            <View className="items-center py-12">
              <Text className="text-3xl mb-2">🗒️</Text>
              <Text className="text-sm text-gray-400">
                {query ? '검색 결과가 없습니다' : '아직 메모가 없습니다'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator color="#7c3aed" />
            </View>
          ) : !hasNext && memos.length > 0 && !query.trim() ? (
            <Text className="text-[11px] text-gray-400 py-4 text-center">
              마지막 메모입니다
            </Text>
          ) : null
        }
      />
    </View>
  );
}
