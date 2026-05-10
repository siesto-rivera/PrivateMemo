import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Markdown from 'react-native-markdown-display';

import { AssetImage } from '@/components/asset-image';
import { MemoEditModal } from '@/components/memo-card';
import { PhotoViewerModal } from '@/components/photo-viewer-modal';
import { ScreenHeader } from '@/components/screen-header';
import { getMemo } from '@/lib/api';
import { REPEAT_LABELS, stickyPalette, type Memo } from '@/lib/types';

export default function MemoDetailScreen() {
  const params = useLocalSearchParams<{ id: string; from?: string }>();
  const id = params.id;
  const fromPath = params.from ? decodeURIComponent(params.from) : null;
  const router = useRouter();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  function goBack() {
    if (fromPath && !fromPath.startsWith('/memo')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(fromPath as any);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  async function reload() {
    try {
      const data = await getMemo(Number(id));
      setMemo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '메모를 불러오지 못했습니다');
    }
  }

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

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader
        title="메모"
        left={
          <Pressable
            onPress={goBack}
            hitSlop={8}
            className="w-9 h-9 rounded-full bg-white/20 active:bg-white/30 items-center justify-center"
          >
            <Text className="text-2xl text-white font-medium leading-none mt-[-2px]">‹</Text>
          </Pressable>
        }
        right={
          memo ? (
            <Pressable
              onPress={() => setEditing(true)}
              hitSlop={8}
              className="px-3 py-1.5 rounded-full bg-white/20 active:bg-white/30"
            >
              <Text className="text-xs text-white font-bold">수정</Text>
            </Pressable>
          ) : null
        }
      />
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {loading ? (
          <Text className="text-sm text-gray-400 py-12 text-center">로딩 중…</Text>
        ) : error ? (
          <Text className="text-sm text-red-500 py-12 text-center">{error}</Text>
        ) : memo ? (
          <>
            <View className="relative mt-2 mb-6 mx-2">
              <View
                style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  marginLeft: -36,
                  width: 72,
                  height: 18,
                  backgroundColor: stickyPalette(memo.category_name).tape,
                  borderRadius: 2,
                  transform: [{ rotate: '-4deg' }],
                  zIndex: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              />
              <View
                style={{
                  backgroundColor: stickyPalette(memo.category_name).bg,
                  borderColor: stickyPalette(memo.category_name).border,
                  borderWidth: 1,
                  transform: [{ rotate: '-0.7deg' }],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.18,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                className="rounded-sm px-6 py-8"
              >
                <Markdown
                  style={{
                    body: { color: '#1f2937', fontSize: 16, lineHeight: 26 },
                    paragraph: { marginTop: 0, marginBottom: 10 },
                    heading1: { color: '#111827', marginTop: 4, marginBottom: 8 },
                    heading2: { color: '#111827', marginTop: 4, marginBottom: 6 },
                    heading3: { color: '#111827', marginTop: 4, marginBottom: 6 },
                    link: { color: '#7c3aed' },
                    code_inline: {
                      backgroundColor: 'rgba(217, 119, 6, 0.15)',
                      paddingHorizontal: 4,
                      borderRadius: 4,
                    },
                  }}
                >
                  {memo.memo}
                </Markdown>
              </View>
            </View>

            {memo.schedule_date ? (
              <View className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
                <Text className="text-xs font-semibold text-gray-500 mb-1">일정</Text>
                <Text className="text-sm text-gray-900">
                  📅 {memo.schedule_date.replace(/-/g, '.')}
                </Text>
              </View>
            ) : null}

            {memo.alarm_date ? (
              <View className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
                <Text className="text-xs font-semibold text-gray-500 mb-1">알림</Text>
                <Text className="text-sm text-gray-900">
                  🔔 {new Date(memo.alarm_date).toLocaleString('ko-KR')}
                  {memo.repeat && memo.repeat !== 'none' ? `  🔁 ${REPEAT_LABELS[memo.repeat]}` : ''}
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

            {memo.images && memo.images.length > 0 ? (
              <View className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
                <Text className="text-xs font-semibold text-gray-500 mb-2">사진</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {memo.images.map((imgId, idx) => (
                    <Pressable
                      key={imgId}
                      onPress={() => setViewerIndex(idx)}
                      className="mr-2 active:opacity-70"
                    >
                      <AssetImage assetId={imgId} size={140} />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <Pressable
              onPress={() => setEditing(true)}
              className="bg-brand-500 rounded-2xl py-4 items-center mt-6 active:bg-brand-600"
            >
              <Text className="text-white text-base font-semibold">수정</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      {editing && memo ? (
        <MemoEditModal
          memo={memo}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
          onDeleted={() => {
            setEditing(false);
            goBack();
          }}
        />
      ) : null}

      {viewerIndex !== null && memo?.images?.length ? (
        <PhotoViewerModal
          imageIds={memo.images}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </View>
  );
}
