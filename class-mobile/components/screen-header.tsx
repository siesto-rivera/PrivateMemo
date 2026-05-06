import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: Props) {
  return (
    <SafeAreaView edges={['top']} className="bg-brand-500">
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
        <View>
          <Text className="text-xl font-bold text-white">{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-white/70 mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
    </SafeAreaView>
  );
}
