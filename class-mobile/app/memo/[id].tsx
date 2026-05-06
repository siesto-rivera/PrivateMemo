import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { getMemo } from '@/lib/api';
import { CATEGORY_EMOJI, formatDate, type Memo } from '@/lib/types';

export default function MemoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMemo(Number(id));
        if (!cancelled) setMemo(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '메모를 불러오지 못했습니다');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const emoji = memo ? CATEGORY_EMOJI[memo.category_name] ?? '📝' : '';

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: true, title: '메모', headerBackTitle: '뒤로' }} />
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {loading ? (
          <Text className="text-sm text-gray-400 py-12 text-center">로딩 중…</Text>
        ) : error ? (
          <Text className="text-sm text-red-500 py-12 text-center">{error}</Text>
        ) : memo ? (
          <>
            <View className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
              <Text className="text-xs font-semibold text-gray-500 mb-1">카테고리</Text>
              <Text className="text-base text-gray-900">
                {emoji} {memo.category_name}
              </Text>
            </View>

            <View className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
              <Text className="text-xs font-semibold text-gray-500 mb-1">내용</Text>
              <Text className="text-[15px] text-gray-900 leading-6">{memo.memo}</Text>
            </View>

            {memo.alarm_date ? (
              <View className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
                <Text className="text-xs font-semibold text-gray-500 mb-1">알림</Text>
                <Text className="text-sm text-gray-900">
                  🔔 {new Date(memo.alarm_date).toLocaleString('ko-KR')}
                </Text>
              </View>
            ) : null}

            {memo.tag.length > 0 ? (
              <View className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
                <Text className="text-xs font-semibold text-gray-500 mb-2">태그</Text>
                <View className="flex-row flex-wrap">
                  {memo.tag.map((t) => (
                    <View key={t} className="bg-brand-50 px-3 py-1 rounded-full mr-1.5 mb-1.5">
                      <Text className="text-[12px] text-brand-700">#{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <Text className="text-[11px] text-gray-400 text-center mt-2">
              생성: {formatDate(memo.createDate)}
            </Text>

            <Pressable
              onPress={() => router.replace('/(tabs)')}
              className="bg-brand-500 rounded-2xl py-4 items-center mt-6 active:bg-brand-600"
            >
              <Text className="text-white text-base font-semibold">홈으로</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
