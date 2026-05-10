import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getImageUri } from '@/lib/images';

type Props = {
  imageIds: string[];
  initialIndex: number;
  onClose: () => void;
};

export function PhotoViewerModal({ imageIds, initialIndex, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);

  if (imageIds.length === 0) return null;
  const currentId = imageIds[index] ?? imageIds[0];
  const isMulti = imageIds.length > 1;

  // Reserve some height for the bottom toolbar so the image fits without overlap.
  const imageAreaHeight = height - 120;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <ZoomableImage assetId={currentId} width={width} height={imageAreaHeight} />
          </View>
        </SafeAreaView>

        {/* Bottom toolbar — separate flex region, never overlaps image */}
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#000' }}>
          {isMulti ? (
            <View className="flex-row items-center justify-between px-6 pt-2 pb-1">
              <Pressable
                onPress={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                hitSlop={12}
                className="px-5 py-2 rounded-full bg-white/10 active:bg-white/25 disabled:opacity-30"
              >
                <Text className="text-white text-base font-bold">‹ 이전</Text>
              </Pressable>
              <Text className="text-white text-sm font-medium">
                {index + 1} / {imageIds.length}
              </Text>
              <Pressable
                onPress={() => setIndex((i) => Math.min(imageIds.length - 1, i + 1))}
                disabled={index === imageIds.length - 1}
                hitSlop={12}
                className="px-5 py-2 rounded-full bg-white/10 active:bg-white/25 disabled:opacity-30"
              >
                <Text className="text-white text-base font-bold">다음 ›</Text>
              </Pressable>
            </View>
          ) : null}

          <View className="px-6 pt-2 pb-2">
            <Pressable
              onPress={onClose}
              className="bg-white rounded-2xl py-3.5 items-center active:bg-gray-200"
            >
              <Text className="text-black text-base font-bold">닫기</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function ZoomableImage({
  assetId,
  width,
  height,
}: {
  assetId: string;
  width: number;
  height: number;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    setMissing(false);
    setUri(null);
    getImageUri(assetId).then((u) => {
      if (!active) return;
      if (u) setUri(u);
      else setMissing(true);
    });
    return () => {
      active = false;
    };
  }, [assetId]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      maximumZoomScale={5}
      minimumZoomScale={1}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      centerContent
      bouncesZoom
      pinchGestureEnabled
    >
      {missing ? (
        <Text className="text-white text-base">사진을 불러올 수 없습니다</Text>
      ) : uri ? (
        <Image source={{ uri }} style={{ width, height }} contentFit="contain" />
      ) : (
        <Text className="text-white text-sm">로딩 중…</Text>
      )}
    </ScrollView>
  );
}
