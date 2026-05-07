import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { MemoCard } from '@/components/memo-card';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getMemos,
  mergeCategory,
  updateCategory,
} from '@/lib/api';
import { syncAlarms } from '@/lib/notifications';
import { useSelectedCategory } from '@/lib/selected-category-context';
import { CATEGORY_EMOJI, type Category, type Memo } from '@/lib/types';

export default function CategoriesScreen() {
  const { setSelectedCategory } = useSelectedCategory();
  const [categories, setCategories] = useState<Category[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  function selectCategory(name: string | null) {
    setSelected(name);
    setSelectedCategory(name);
  }
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, m] = await Promise.all([getCategories(), getMemos()]);
      setCategories(c);
      setMemos(m);
      syncAlarms(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다');
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

  const counts = memos.reduce<Record<string, number>>((acc, m) => {
    acc[m.category_name] = (acc[m.category_name] ?? 0) + 1;
    return acc;
  }, {});

  async function addCategory() {
    const name = draft.trim();
    if (!name || submitting) return;
    if (categories.some((c) => c.name === name)) {
      Alert.alert('이미 있는 카테고리입니다');
      return;
    }
    setSubmitting(true);
    try {
      await createCategory({ name });
      setDraft('');
      await load();
    } catch (e) {
      Alert.alert('카테고리 추가 실패', e instanceof Error ? e.message : '');
    } finally {
      setSubmitting(false);
    }
  }

  function removeCategory(c: Category) {
    const cnt = counts[c.name] ?? 0;
    const message =
      cnt > 0
        ? `"${c.name}" 카테고리를 삭제하시겠습니까?\n메모 ${cnt}개는 '미분류'로 이동됩니다.`
        : `"${c.name}" 카테고리를 삭제하시겠습니까?`;
    Alert.alert('카테고리 삭제', message, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(c.id);
            await load();
          } catch (e) {
            Alert.alert('삭제 실패', e instanceof Error ? e.message : '');
          }
        },
      },
    ]);
  }

  const filteredMemos = selected
    ? memos.filter((m) => m.category_name === selected)
    : [];

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title={selected ? selected : '카테고리'}
        subtitle={
          selected ? `${filteredMemos.length}개의 메모` : `${categories.length}개의 카테고리`
        }
        right={
          selected ? (
            <Pressable
              onPress={() => selectCategory(null)}
              className="px-3 py-1.5 rounded-full bg-white/20 active:bg-white/30"
            >
              <Text className="text-xs text-white font-medium">← 전체</Text>
            </Pressable>
          ) : null
        }
      />
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
        ) : selected ? (
          filteredMemos.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-3xl mb-2">📭</Text>
              <Text className="text-sm text-gray-400">이 카테고리에는 아직 메모가 없습니다</Text>
            </View>
          ) : (
            filteredMemos.map((m) => <MemoCard key={String(m.id)} memo={m} onChanged={load} />)
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
                disabled={submitting}
                className="bg-brand-500 rounded-2xl px-4 justify-center active:bg-brand-600 disabled:opacity-50"
              >
                <Text className="text-white text-sm font-semibold">추가</Text>
              </Pressable>
            </View>

            <View className="flex-row flex-wrap -mx-1">
              {categories.map((c) => {
                const emoji = c.emoji || CATEGORY_EMOJI[c.name] || '🏷️';
                const cnt = counts[c.name] ?? 0;
                const protectedCat = c.name === '미분류';
                return (
                  <View key={String(c.id)} className="w-1/2 px-1 mb-2">
                    <View className="relative">
                      <Pressable
                        onPress={() => selectCategory(c.name)}
                        className="bg-white rounded-2xl px-4 py-4 border border-gray-100 active:bg-gray-50"
                      >
                        <Text className="text-2xl mb-1">{emoji}</Text>
                        <Text
                          className="text-sm font-semibold text-gray-900 pr-6"
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                        <Text className="text-[11px] text-gray-400 mt-0.5">{cnt}개</Text>
                      </Pressable>
                      {protectedCat ? null : (
                        <>
                          <Pressable
                            onPress={() => setEditing(c)}
                            hitSlop={8}
                            accessibilityLabel={`${c.name} 수정`}
                            className="absolute top-2 right-10 w-6 h-6 rounded-full bg-gray-100 active:bg-brand-100 items-center justify-center"
                          >
                            <Text className="text-xs text-gray-500 active:text-brand-700 leading-none">
                              ✎
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => removeCategory(c)}
                            hitSlop={8}
                            accessibilityLabel={`${c.name} 삭제`}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 active:bg-red-100 items-center justify-center"
                          >
                            <Text className="text-base text-gray-500 leading-none">×</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      {editing ? (
        <CategoryEditModal
          category={editing}
          categories={categories}
          memoCount={counts[editing.name] ?? 0}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      ) : null}
    </View>
  );
}

function CategoryEditModal({
  category,
  categories,
  memoCount,
  onClose,
  onSaved,
}: {
  category: Category;
  categories: Category[];
  memoCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [emoji, setEmoji] = useState(category.emoji || CATEGORY_EMOJI[category.name] || '');
  const [saving, setSaving] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mergeTargets = categories.filter((c) => c.id !== category.id);

  async function save() {
    if (saving || merging) return;
    const n = name.trim();
    if (!n) {
      setError('이름을 입력해주세요');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateCategory(category.id, { name: n, emoji: emoji.trim() });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  function pickMerge() {
    if (saving || merging) return;
    if (mergeTargets.length === 0) {
      Alert.alert('통합할 대상이 없습니다');
      return;
    }
    Alert.alert(
      '통합할 카테고리 선택',
      `"${category.name}"의 메모 ${memoCount}개를 어디로 옮길까요?\n옮긴 뒤 "${category.name}"는 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        ...mergeTargets.map((t) => ({
          text: `${t.emoji || '🏷️'} ${t.name}`,
          onPress: () => doMerge(t),
        })),
      ],
    );
  }

  async function doMerge(target: Category) {
    setError(null);
    setMerging(true);
    try {
      await mergeCategory(category.id, target.id);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '통합 실패');
    } finally {
      setMerging(false);
    }
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="bg-black/40 flex-1 justify-center items-center px-5">
          <View className="bg-white rounded-2xl p-5 w-full max-w-md">
            <Text className="text-base font-semibold text-gray-900 mb-3">카테고리 수정</Text>

            <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">이름</Text>
            <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-3 border border-gray-100">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="카테고리 이름"
                placeholderTextColor="#9ca3af"
                className="text-[15px] text-gray-900"
              />
            </View>

            <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">이모지</Text>
            <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-3 border border-gray-100 w-16">
              <TextInput
                value={emoji}
                onChangeText={setEmoji}
                placeholder="🏷️"
                placeholderTextColor="#9ca3af"
                className="text-[18px] text-gray-900"
              />
            </View>

            {error ? (
              <Text className="text-xs text-red-500 mb-3 ml-1">{error}</Text>
            ) : null}

            <Pressable
              onPress={save}
              disabled={saving || merging}
              className="bg-brand-500 rounded-2xl py-3.5 items-center active:bg-brand-600 disabled:opacity-50 mb-2"
            >
              <Text className="text-white text-base font-semibold">
                {saving ? '저장 중…' : '저장'}
              </Text>
            </Pressable>

            <View className="flex-row items-center my-3">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-3 text-[11px] text-gray-400">또는</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <Text className="text-[11px] text-gray-400 mb-2 ml-1">
              메모를 다른 카테고리로 옮기고 이 카테고리를 삭제합니다.
            </Text>
            <Pressable
              onPress={pickMerge}
              disabled={saving || merging}
              className="bg-amber-500 rounded-2xl py-3.5 items-center active:bg-amber-600 disabled:opacity-50 mb-2"
            >
              <Text className="text-white text-base font-semibold">
                {merging ? '통합 중…' : '다른 카테고리로 통합'}
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={saving || merging}
              className="rounded-2xl py-3 items-center active:bg-gray-100 disabled:opacity-50 mt-2"
            >
              <Text className="text-gray-600 text-base font-medium">취소</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
