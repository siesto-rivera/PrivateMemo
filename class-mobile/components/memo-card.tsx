import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import {
  Memo,
  formatDate,
  CATEGORY_EMOJI,
  REPEAT_LABELS,
  stickyPalette,
  type Category,
  type Repeat,
} from '@/lib/types';
import { deleteMemo, getCategories, getMemos, updateMemo } from '@/lib/api';
import { syncAlarms } from '@/lib/notifications';
import { AssetImage } from '@/components/asset-image';
import { DateTimePickerButton } from '@/components/datetime-picker-button';
import { ImageAttachRow } from '@/components/image-attach-row';

const REPEAT_OPTIONS: Repeat[] = ['none', 'daily', 'weekly', 'monthly'];

type Props = { memo: Memo; onChanged?: () => void; highlighted?: boolean };

const STICKY_TILTS = [-0.8, 0.7, -0.5, 0.9, -0.6];

export function MemoCard({ memo, highlighted = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const emoji = CATEGORY_EMOJI[memo.category_name] ?? '📝';
  const tilt = STICKY_TILTS[memo.id % STICKY_TILTS.length];
  const palette = stickyPalette(memo.category_name);

  return (
    <Pressable
      onPress={() =>
        router.push(`/memo/${memo.id}?from=${encodeURIComponent(pathname)}`)
      }
      style={{
        backgroundColor: palette.bg,
        borderColor: highlighted ? '#7c3aed' : palette.border,
        borderWidth: highlighted ? 2 : 1,
        transform: [{ rotate: `${tilt}deg` }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.13,
        shadowRadius: 5,
        elevation: 3,
      }}
      className="rounded-md px-4 py-3.5 mb-4"
    >
        <View className="flex-row items-center mb-1.5">
          <Text className="text-lg mr-2">{emoji}</Text>
          <Text className="text-xs font-semibold text-brand-700">{memo.category_name}</Text>
          {memo.alarm_date ? (
            <View className="ml-auto bg-white/70 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] text-amber-800 font-medium">
                🔔 {formatDate(memo.alarm_date)}
                {memo.repeat && memo.repeat !== 'none' ? ` 🔁 ${REPEAT_LABELS[memo.repeat]}` : ''}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row">
          <View className="flex-1">
            <Text className="text-[15px] text-gray-900 leading-5" numberOfLines={2}>
              {memo.memo}
            </Text>
          </View>
          {memo.images && memo.images.length > 0 ? (
            <View className="ml-3 relative">
              <AssetImage assetId={memo.images[0]} size={44} />
              {memo.images.length > 1 ? (
                <View className="absolute -bottom-1 -right-1 bg-gray-700 px-1.5 py-0.5 rounded-full">
                  <Text className="text-[10px] text-white font-semibold">
                    +{memo.images.length - 1}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
        <View className="flex-row flex-wrap items-center mt-2">
          {memo.tag.map((t) => (
            <View key={t} className="bg-white/60 px-2 py-0.5 rounded-full mr-1.5 mb-1">
              <Text className="text-[11px] text-gray-700">#{t}</Text>
            </View>
          ))}
          {memo.schedule_date ? (
            <Text className="text-[11px] text-gray-500 ml-auto">
              📅 {memo.schedule_date.replace(/-/g, '.')}
            </Text>
          ) : null}
        </View>
    </Pressable>
  );
}

export function MemoEditModal({
  memo,
  onClose,
  onSaved,
  onDeleted,
}: {
  memo: Memo;
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [category, setCategory] = useState<string>(memo.category_name);
  const [content, setContent] = useState(memo.memo);
  const [hasSchedule, setHasSchedule] = useState(!!memo.schedule_date);
  const [scheduleDate, setScheduleDate] = useState<Date>(() =>
    memo.schedule_date ? new Date(memo.schedule_date + 'T00:00:00') : new Date(),
  );
  const [hasAlarm, setHasAlarm] = useState(!!memo.alarm_date);
  const [alarmDate, setAlarmDate] = useState<Date>(
    memo.alarm_date ? new Date(memo.alarm_date) : (() => {
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      return d;
    })(),
  );
  const [repeat, setRepeat] = useState<Repeat>(memo.repeat ?? 'none');
  const [tags, setTags] = useState<string[]>(memo.tag ?? []);
  const [images, setImages] = useState<string[]>(memo.images ?? []);
  const [tagDraft, setTagDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : '카테고리 로딩 실패');
      } finally {
        if (active) setLoadingCats(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function addTag() {
    const t = tagDraft.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  }

  const onSave = useCallback(async () => {
    if (saving) return;
    if (!content.trim()) {
      setError('메모 내용을 입력해주세요');
      return;
    }
    if (!category) {
      setError('카테고리를 선택해주세요');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateMemo(memo.id, {
        category_name: category,
        memo: content.trim(),
        alarm_date: hasAlarm ? alarmDate.toISOString() : null,
        schedule_date: hasSchedule
          ? `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getDate()).padStart(2, '0')}`
          : null,
        repeat: hasAlarm ? repeat : 'none',
        tag: tags,
        images,
      });
      // Re-sync alarms so the change is reflected in the OS notification queue.
      try {
        const allMemos = await getMemos();
        await syncAlarms(allMemos);
      } catch {
        // best-effort
      }
      onClose();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }, [saving, content, category, hasAlarm, alarmDate, hasSchedule, scheduleDate, repeat, tags, images, memo.id, onClose, onSaved]);

  function onDelete() {
    Alert.alert('메모 삭제', '이 메모를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMemo(memo.id);
            // Re-sync alarms to remove the deleted memo's notification.
            try {
              const allMemos = await getMemos();
              await syncAlarms(allMemos);
            } catch {
              // best-effort
            }
            onClose();
            onDeleted?.();
          } catch (e) {
            setError(e instanceof Error ? e.message : '삭제 실패');
          }
        },
      },
    ]);
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
          <View className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[90%]">
            <Text className="text-base font-semibold text-gray-900 mb-3">메모 수정</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">카테고리</Text>
              {loadingCats ? (
                <Text className="text-sm text-gray-400 mb-4 ml-1">로딩 중…</Text>
              ) : categories.length === 0 ? (
                <Text className="text-sm text-gray-400 mb-4 ml-1">카테고리가 없습니다</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
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
                          className={`text-xs font-medium ${
                            active ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {emoji} {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">내용</Text>
              <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-4 border border-gray-100">
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  multiline
                  placeholder="제목, URL, 메모 내용 등"
                  placeholderTextColor="#9ca3af"
                  className="text-[15px] text-gray-900 min-h-[80px]"
                  textAlignVertical="top"
                />
              </View>

              <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">태그</Text>
              <View className="flex-row mb-2">
                <View className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 mr-2 border border-gray-100 flex-row items-center">
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
              <View className="flex-row flex-wrap mb-4">
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
              <View className="mb-4">
                <ImageAttachRow
                  ids={images}
                  onChange={(next) => {
                    if (next.length > images.length && content.trim() === '') {
                      setContent('포토 메모');
                    }
                    setImages(next);
                  }}
                />
              </View>

              <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-4 border border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
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

              <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-4 border border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
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

              {error ? (
                <Text className="text-xs text-red-500 mb-3 ml-1">{error}</Text>
              ) : null}

              <Pressable
                onPress={onSave}
                disabled={saving}
                className="bg-brand-500 rounded-2xl py-3.5 items-center active:bg-brand-600 disabled:opacity-50 mb-2"
              >
                <Text className="text-white text-base font-semibold">
                  {saving ? '저장 중…' : '저장'}
                </Text>
              </Pressable>
              <Pressable
                onPress={onDelete}
                disabled={saving}
                className="bg-red-50 rounded-2xl py-3.5 items-center active:bg-red-100 disabled:opacity-50 mb-2"
              >
                <Text className="text-red-600 text-base font-semibold">삭제</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                disabled={saving}
                className="rounded-2xl py-3 items-center active:bg-gray-100 disabled:opacity-50"
              >
                <Text className="text-gray-600 text-base font-medium">취소</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
