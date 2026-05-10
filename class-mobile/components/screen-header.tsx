import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, left, right }: Props) {
  return (
    <SafeAreaView edges={['top']} className="bg-brand-500">
      <View className="px-3 pt-2 pb-4 flex-row items-center" style={{ minHeight: 56 }}>
        <View>{left}</View>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 8,
            bottom: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="text-xl font-bold text-white" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-xs text-white/70 mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="ml-auto">{right}</View>
      </View>
    </SafeAreaView>
  );
}
