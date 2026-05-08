import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { useAppLock } from '@/lib/app-lock-context';


export function LockScreen() {
  const { locked, unlock } = useAppLock();

  useEffect(() => {
    if (locked) {
      // Auto-trigger biometric prompt as soon as the lock screen mounts.
      unlock();
    }
  }, [locked, unlock]);

  return (
    <Modal
      visible={locked}
      animationType="fade"
      onRequestClose={() => {
        /* prevent dismiss without unlock */
      }}
    >
      <View className="flex-1 bg-brand-500 items-center justify-center px-8">
        <Text className="text-6xl mb-6">🔒</Text>
        <Text className="text-white text-xl font-bold mb-2">잠겨있습니다</Text>
        <Text className="text-white/80 text-sm mb-10 text-center">
          지극히 사적인 메모장
        </Text>
        <Pressable
          onPress={unlock}
          className="bg-white rounded-2xl px-8 py-3.5 active:opacity-90"
        >
          <Text className="text-brand-700 text-base font-semibold">잠금 해제</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
