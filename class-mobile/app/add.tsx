import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { DateTimePickerButton } from '@/components/datetime-picker-button';
import { ImageAttachRow } from '@/components/image-attach-row';
import { createCategory, createMemo, getCategories } from '@/lib/api';
import { useSelectedCategory } from '@/lib/selected-category-context';
import { CATEGORY_EMOJI, REPEAT_LABELS, type Category, type Repeat } from '@/lib/types';

const REPEAT_OPTIONS: Repeat[] = ['none', 'daily', 'weekly', 'monthly'];

function defaultAlarmDate(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const fromCalendar = params.from === 'calendar';
  const { selectedCategory } = useSelectedCategory();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [hasSchedule, setHasSchedule] = useState(fromCalendar);
  const [scheduleDate, setScheduleDate] = useState<Date>(() => new Date());
  const [hasAlarm, setHasAlarm] = useState(false);
  const [alarmDate, setAlarmDate] = useState<Date>(defaultAlarmDate);
  const [repeat, setRepeat] = useState<Repeat>('none');
  const [saving, setSaving] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newError, setNewError] = useState<string | null>(null);
  const [creatingCat, setCreatingCat] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const data = await getCategories();
          if (!active) return;
          const sorted = [...data].sort((a, b) => {
            if (a.name === '미분류') return -1;
            if (b.name === '미분류') return 1;
            return a.name.localeCompare(b.name, 'ko');
          });
          setCategories(sorted);
          setCategory((prev) => {
            if (selectedCategory && sorted.some((c) => c.name === selectedCategory)) {
              return selectedCategory;
            }
            if (prev && sorted.some((c) => c.name === prev)) return prev;
            return sorted[0]?.name ?? '';
          });
        } catch (e) {
          if (active) Alert.alert('카테고리 로딩 실패', e instanceof Error ? e.message : '');
        } finally {
          if (active) setLoadingCats(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [selectedCategory]),
  );

  function addTag() {
    const t = tagDraft.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  }

  function openNewCategory() {
    setNewName('');
    setNewEmoji('');
    setNewError(null);
    setNewOpen(true);
  }

  async function submitNewCategory() {
    if (creatingCat) return;
    const name = newName.trim();
    if (!name) {
      setNewError('이름을 입력해주세요');
      return;
    }
    if (categories.some((c) => c.name === name)) {
      setNewError('이미 있는 카테고리입니다');
      return;
    }
    setNewError(null);
    setCreatingCat(true);
    try {
      const created = await createCategory({ name, emoji: newEmoji.trim() || undefined });
      const next = [...categories, created].sort((a, b) => {
        if (a.name === '미분류') return -1;
        if (b.name === '미분류') return 1;
        return a.name.localeCompare(b.name, 'ko');
      });
      setCategories(next);
      setCategory(created.name);
      setNewOpen(false);
    } catch (e) {
      setNewError(e instanceof Error ? e.message : '추가 실패');
    } finally {
      setCreatingCat(false);
    }
  }

  async function save() {
    if (saving) return;
    if (!memo.trim()) {
      Alert.alert('메모 내용을 입력해주세요');
      return;
    }
    if (!category) {
      Alert.alert('카테고리를 선택해주세요');
      return;
    }
    setSaving(true);
    try {
      await createMemo({
        category_name: category,
        memo: memo.trim(),
        alarm_date: hasAlarm ? alarmDate.toISOString() : null,
        schedule_date: hasSchedule
          ? `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getDate()).padStart(2, '0')}`
          : null,
        repeat: hasAlarm ? repeat : 'none',
        tag: tags,
        images,
      });
      setMemo('');
      setTags([]);
      setImages([]);
      setHasSchedule(false);
      setScheduleDate(new Date());
      setHasAlarm(false);
      setAlarmDate(defaultAlarmDate());
      setRepeat('none');
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('저장 실패', e instanceof Error ? e.message : '');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title="새 메모"
        subtitle="기록하고 분류하세요"
        left={
          <Pressable
            onPress={() => {
              if (fromCalendar) {
                if (router.canGoBack()) router.back();
                else router.navigate('/(tabs)/calendar');
                return;
              }
              if (selectedCategory) {
                router.navigate('/(tabs)/categories');
                return;
              }
              if (router.canGoBack()) router.back();
              else router.navigate('/(tabs)');
            }}
            hitSlop={8}
            className="w-9 h-9 rounded-full bg-white/20 active:bg-white/30 items-center justify-center"
          >
            <Text className="text-2xl text-white font-medium leading-none mt-[-2px]">‹</Text>
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 64 }}>
        <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">카테고리</Text>
        {loadingCats ? (
          <Text className="text-sm text-gray-400 mb-5 ml-1">로딩 중…</Text>
        ) : categories.length === 0 ? (
          <Text className="text-sm text-gray-400 mb-5 ml-1">
            카테고리가 없습니다. 먼저 카테고리를 추가하세요.
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
            {categories.map((c) => {
              const active = c.name === category;
              const emoji = c.emoji || CATEGORY_EMOJI[c.name] || '🏷️';
              return (
                <Pressable
                  key={String(c.id)}
                  onPress={() => setCategory(c.name)}
                  className={`mr-2 px-3.5 py-2 rounded-full border ${
                    active ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${active ? 'text-white' : 'text-gray-700'}`}
                  >
                    {emoji} {c.name}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={openNewCategory}
              className="mr-2 px-3.5 py-2 rounded-full border border-dashed border-brand-400 bg-white active:bg-brand-50"
            >
              <Text className="text-xs font-medium text-brand-600">+ 새 카테고리</Text>
            </Pressable>
          </ScrollView>
        )}

        <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">내용</Text>
        <View className="bg-white rounded-2xl px-4 py-3 mb-5 border border-gray-100">
          <TextInput
            value={memo}
            onChangeText={setMemo}
            multiline
            placeholder="제목, URL, 메모 내용 등"
            placeholderTextColor="#9ca3af"
            className="text-[15px] text-gray-900 min-h-[100px]"
            textAlignVertical="top"
          />
        </View>

        <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">태그</Text>
        <View className="flex-row mb-2">
          <View className="flex-1 bg-white rounded-2xl px-4 py-3 mr-2 border border-gray-100 flex-row items-center">
            <Text className="text-base mr-2 text-gray-400">#</Text>
            <TextInput
              value={tagDraft}
              onChangeText={setTagDraft}
              onSubmitEditing={addTag}
              returnKeyType="done"
              placeholder="태그 추가"
              placeholderTextColor="#9ca3af"
              className="flex-1 text-[15px] text-gray-900"
            />
          </View>
          <Pressable
            onPress={addTag}
            className="bg-gray-200 rounded-2xl px-4 justify-center active:bg-gray-300"
          >
            <Text className="text-gray-700 text-sm font-semibold">+</Text>
          </Pressable>
        </View>
        <View className="flex-row flex-wrap mb-5">
          {tags.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTags(tags.filter((x) => x !== t))}
              className="bg-brand-50 px-3 py-1 rounded-full mr-1.5 mb-1.5"
            >
              <Text className="text-[12px] text-brand-700">#{t} ✕</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">사진</Text>
        <View className="mb-5">
          <ImageAttachRow
            ids={images}
            onChange={(next) => {
              if (next.length > images.length && memo.trim() === '') {
                setMemo('포토 메모');
              }
              setImages(next);
            }}
          />
        </View>

        <View className="bg-white rounded-2xl px-4 py-3 mb-5 border border-gray-100">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-semibold text-gray-900">📅 일정에 추가</Text>
              <Text className="text-[11px] text-gray-400 mt-0.5">
                선택한 날짜의 일정 캘린더에 표시됩니다
              </Text>
            </View>
            <Switch
              value={hasSchedule}
              onValueChange={setHasSchedule}
              trackColor={{ true: '#7c3aed', false: '#d1d5db' }}
            />
          </View>
          {hasSchedule ? (
            <DateTimePickerButton
              value={scheduleDate}
              onChange={setScheduleDate}
              mode="date"
            />
          ) : null}
        </View>

        <View className="bg-white rounded-2xl px-4 py-3 mb-5 border border-gray-100">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-semibold text-gray-900">🔔 알림 예약</Text>
              <Text className="text-[11px] text-gray-400 mt-0.5">
                지정한 날짜에 푸시 알림을 받습니다
              </Text>
            </View>
            <Switch
              value={hasAlarm}
              onValueChange={setHasAlarm}
              trackColor={{ true: '#7c3aed', false: '#d1d5db' }}
            />
          </View>
          {hasAlarm ? (
            <>
              <DateTimePickerButton value={alarmDate} onChange={setAlarmDate} />
              <View className="flex-row mt-3 -mx-1">
                {REPEAT_OPTIONS.map((r) => {
                  const active = r === repeat;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRepeat(r)}
                      className={`flex-1 mx-1 px-3 py-2 rounded-full border ${
                        active ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-xs text-center font-medium ${active ? 'text-white' : 'text-gray-700'}`}
                      >
                        {REPEAT_LABELS[r]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>

        <Pressable
          onPress={save}
          disabled={saving}
          className="bg-brand-500 rounded-2xl py-4 items-center active:bg-brand-600 disabled:opacity-50"
        >
          <Text className="text-white text-base font-semibold">
            {saving ? '저장 중…' : '메모 저장'}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={newOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !creatingCat && setNewOpen(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="bg-black/40 flex-1 justify-center items-center px-5">
            <View className="bg-white rounded-2xl p-5 w-full max-w-md">
              <Text className="text-base font-semibold text-gray-900 mb-3">새 카테고리</Text>

              <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">이름</Text>
              <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-3 border border-gray-100">
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  onSubmitEditing={submitNewCategory}
                  placeholder="카테고리 이름"
                  placeholderTextColor="#9ca3af"
                  autoFocus
                  className="text-[15px] text-gray-900"
                />
              </View>

              <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">이모지 (선택)</Text>
              <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-3 border border-gray-100 w-16">
                <TextInput
                  value={newEmoji}
                  onChangeText={setNewEmoji}
                  placeholder="🏷️"
                  placeholderTextColor="#9ca3af"
                  className="text-[18px] text-gray-900"
                />
              </View>

              {newError ? (
                <Text className="text-xs text-red-500 mb-3 ml-1">{newError}</Text>
              ) : null}

              <Pressable
                onPress={submitNewCategory}
                disabled={creatingCat}
                className="bg-brand-500 rounded-2xl py-3.5 items-center active:bg-brand-600 disabled:opacity-50 mb-2"
              >
                <Text className="text-white text-base font-semibold">
                  {creatingCat ? '추가 중…' : '추가'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNewOpen(false)}
                disabled={creatingCat}
                className="rounded-2xl py-3 items-center active:bg-gray-100 disabled:opacity-50"
              >
                <Text className="text-gray-600 text-base font-medium">취소</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
