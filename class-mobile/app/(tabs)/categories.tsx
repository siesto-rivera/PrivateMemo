import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { ScreenHeader } from '@/components/screen-header';
import { MemoCard } from '@/components/memo-card';
import { DEFAULT_CATEGORIES, MOCK_MEMOS, CATEGORY_EMOJI } from '@/lib/mock-data';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const counts = MOCK_MEMOS.reduce<Record<string, number>>((acc, m) => {
    acc[m.category_name] = (acc[m.category_name] ?? 0) + 1;
    return acc;
  }, {});

  function addCategory() {
    const name = draft.trim();
    if (!name) return;
    if (categories.includes(name)) {
      Alert.alert('이미 있는 카테고리입니다');
      return;
    }
    setCategories([...categories, name]);
    setDraft('');
  }

  const memos = selected
    ? MOCK_MEMOS.filter((m) => m.category_name === selected)
    : [];

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title={selected ? selected : '카테고리'}
        subtitle={selected ? `${memos.length}개의 메모` : `${categories.length}개의 카테고리`}
        right={
          selected ? (
            <Pressable
              onPress={() => setSelected(null)}
              className="px-3 py-1.5 rounded-full bg-gray-100"
            >
              <Text className="text-xs text-gray-600">← 전체</Text>
            </Pressable>
          ) : null
        }
      />
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {selected ? (
          memos.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-3xl mb-2">📭</Text>
              <Text className="text-sm text-gray-400">이 카테고리에는 아직 메모가 없습니다</Text>
            </View>
          ) : (
            memos.map((m) => <MemoCard key={m.id} memo={m} />)
          )
        ) : (
          <>
            <View className="flex-row mb-4">
              <View className="flex-1 bg-white rounded-2xl px-4 py-3 mr-2 border border-gray-100 flex-row items-center">
                <Text className="text-base mr-2">➕</Text>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={addCategory}
                  returnKeyType="done"
                  placeholder="새 카테고리 이름"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 text-[15px] text-gray-900"
                />
              </View>
              <Pressable
                onPress={addCategory}
                className="bg-brand-500 rounded-2xl px-4 justify-center active:bg-brand-600"
              >
                <Text className="text-white text-sm font-semibold">추가</Text>
              </Pressable>
            </View>

            <View className="flex-row flex-wrap -mx-1">
              {categories.map((c) => {
                const emoji = CATEGORY_EMOJI[c] ?? '🏷️';
                const cnt = counts[c] ?? 0;
                return (
                  <View key={c} className="w-1/2 px-1 mb-2">
                    <Pressable
                      onPress={() => setSelected(c)}
                      className="bg-white rounded-2xl px-4 py-4 border border-gray-100 active:bg-gray-50"
                    >
                      <Text className="text-2xl mb-1">{emoji}</Text>
                      <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                        {c}
                      </Text>
                      <Text className="text-[11px] text-gray-400 mt-0.5">{cnt}개</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
