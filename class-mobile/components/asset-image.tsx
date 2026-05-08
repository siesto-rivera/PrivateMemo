import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

import { getImageUri } from '@/lib/images';


type Props = {
  assetId: string;
  size?: number;
  rounded?: boolean;
};


export function AssetImage({ assetId, size = 60, rounded = true }: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    getImageUri(assetId).then((u) => {
      if (!active) return;
      if (u) setUri(u);
      else setMissing(true);
    });
    return () => {
      active = false;
    };
  }, [assetId]);

  const style = {
    width: size,
    height: size,
    borderRadius: rounded ? 12 : 0,
    backgroundColor: '#f3f4f6',
  };

  if (missing) {
    return (
      <View
        style={style}
        className="items-center justify-center border border-dashed border-gray-300"
      >
        <Text className="text-[10px] text-gray-400">사진 없음</Text>
      </View>
    );
  }
  if (!uri) {
    return <View style={style} />;
  }
  return <Image source={{ uri }} style={style} contentFit="cover" />;
}
