import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, Switch } from 'react-native';
import { ScreenHeader } from '@/components/screen-header';
import { DEFAULT_CATEGORIES, CATEGORY_EMOJI } from '@/lib/mock-data';

export default function AddScreen() {
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [memo, setMemo] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [hasAlarm, setHasAlarm] = useState(false);
  const [alarmDate, setAlarmDate] = useState('');

  function addTag() {
    const t = tagDraft.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  }

  function save() {
    if (!memo.trim()) {
      Alert.alert('메모 내용을 입력해주세요');
      return;
    }
    Alert.alert('저장됨 (mock)', `${category}: ${memo.slice(0, 30)}…`);
    setMemo('');
    setTags([]);
    setHasAlarm(false);
    setAlarmDate('');
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="새 메모" subtitle="기록하고 분류하세요" />
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 64 }}>
        <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">카테고리</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {DEFAULT_CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                className={`mr-2 px-3.5 py-2 rounded-full border ${
                  active
                    ? 'bg-brand-500 border-brand-500'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    active ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {CATEGORY_EMOJI[c] ?? '🏷️'} {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

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
            <TextInput
              value={alarmDate}
              onChangeText={setAlarmDate}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor="#9ca3af"
              className="mt-3 bg-gray-50 rounded-xl px-3 py-2 text-[14px] text-gray-900"
            />
          ) : null}
        </View>

        <Pressable
          onPress={save}
          className="bg-brand-500 rounded-2xl py-4 items-center active:bg-brand-600"
        >
          <Text className="text-white text-base font-semibold">메모 저장</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
