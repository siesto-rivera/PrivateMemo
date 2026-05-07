import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';

import { emptyTrash, forceDeleteMemo, getTrash, restoreMemo } from '@/lib/api';
import { CATEGORY_EMOJI, formatDate, type Memo } from '@/lib/types';


export default function TrashScreen() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getTrash();
      setMemos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '휴지통을 불러오지 못했습니다');
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

  function onRestore(m: Memo) {
    Alert.alert('메모 복원', `"${m.memo.slice(0, 30)}…"를 복원할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '복원',
        onPress: async () => {
          try {
            await restoreMemo(m.id);
            await load();
          } catch (e) {
            Alert.alert('복원 실패', e instanceof Error ? e.message : '');
          }
        },
      },
    ]);
  }

  function onForceDelete(m: Memo) {
    Alert.alert('영구 삭제', `이 메모를 영구 삭제합니다. 복구할 수 없습니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '영구 삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await forceDeleteMemo(m.id);
            await load();
          } catch (e) {
            Alert.alert('삭제 실패', e instanceof Error ? e.message : '');
          }
        },
      },
    ]);
  }

  function onEmpty() {
    if (memos.length === 0) return;
    Alert.alert(
      '휴지통 비우기',
      `${memos.length}개의 메모가 영구 삭제됩니다. 복구할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '비우기',
          style: 'destructive',
          onPress: async () => {
            try {
              await emptyTrash();
              await load();
            } catch (e) {
              Alert.alert('실패', e instanceof Error ? e.message : '');
            }
          },
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: true,
          title: '휴지통',
          headerBackTitle: '뒤로',
        }}
      />
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <Text className="text-sm text-gray-400 py-12 text-center">로딩 중…</Text>
        ) : error ? (
          <Text className="text-sm text-red-500 py-12 text-center">{error}</Text>
        ) : memos.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-3xl mb-2">🗑️</Text>
            <Text className="text-sm text-gray-400">휴지통이 비어있습니다</Text>
          </View>
        ) : (
          <>
            <Text className="text-[11px] text-gray-400 mb-3 ml-1">
              30일이 지나면 자동으로 영구 삭제됩니다.
            </Text>
            <Pressable
              onPress={onEmpty}
              className="bg-red-50 active:bg-red-100 rounded-2xl py-2.5 items-center mb-4"
            >
              <Text className="text-sm font-semibold text-red-600">휴지통 비우기 ({memos.length}개)</Text>
            </Pressable>
            {memos.map((m) => {
              const emoji = CATEGORY_EMOJI[m.category_name] ?? '📝';
              return (
                <View
                  key={String(m.id)}
                  className="bg-white rounded-2xl px-4 py-3.5 mb-3 border border-gray-100"
                >
                  <View className="flex-row items-center mb-1">
                    <Text className="text-base mr-2">{emoji}</Text>
                    <Text className="text-xs font-semibold text-gray-500">{m.category_name}</Text>
                    <Text className="text-[11px] text-gray-400 ml-auto">
                      {formatDate(m.createDate)}
                    </Text>
                  </View>
                  <Text className="text-[14px] text-gray-700 leading-5 mb-2" numberOfLines={2}>
                    {m.memo}
                  </Text>
                  <View className="flex-row mt-1">
                    <Pressable
                      onPress={() => onRestore(m)}
                      className="flex-1 mr-1.5 bg-gray-100 active:bg-gray-200 rounded-xl py-2 items-center"
                    >
                      <Text className="text-xs font-semibold text-gray-700">복원</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onForceDelete(m)}
                      className="flex-1 ml-1.5 bg-red-50 active:bg-red-100 rounded-xl py-2 items-center"
                    >
                      <Text className="text-xs font-semibold text-red-600">영구 삭제</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}
