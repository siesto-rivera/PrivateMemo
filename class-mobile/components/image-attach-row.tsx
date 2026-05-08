import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AssetImage } from '@/components/asset-image';
import { pickFromCamera, pickFromLibrary } from '@/lib/images';


type Props = {
  ids: string[];
  onChange: (next: string[]) => void;
  max?: number;
};


export function ImageAttachRow({ ids, onChange, max = 6 }: Props) {
  function pick() {
    if (ids.length >= max) {
      Alert.alert(`최대 ${max}장까지 첨부할 수 있습니다`);
      return;
    }
    Alert.alert('사진 추가', '어디서 가져올까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '카메라',
        onPress: async () => {
          const id = await pickFromCamera();
          if (id) onChange([...ids, id]);
        },
      },
      {
        text: '사진 라이브러리',
        onPress: async () => {
          const id = await pickFromLibrary();
          if (id && !ids.includes(id)) onChange([...ids, id]);
        },
      },
    ]);
  }

  function remove(id: string) {
    onChange(ids.filter((x) => x !== id));
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {ids.map((id) => (
        <View key={id} className="mr-2 relative">
          <AssetImage assetId={id} size={64} />
          <Pressable
            onPress={() => remove(id)}
            hitSlop={6}
            className="absolute -top-1.5 -right-1.5 bg-gray-700 w-5 h-5 rounded-full items-center justify-center"
          >
            <Text className="text-white text-[11px] leading-none">×</Text>
          </Pressable>
        </View>
      ))}
      {ids.length < max ? (
        <Pressable
          onPress={pick}
          className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-white items-center justify-center active:bg-gray-50"
        >
          <Text className="text-2xl text-gray-400">＋</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
