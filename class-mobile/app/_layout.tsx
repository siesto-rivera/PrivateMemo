import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppLockProvider } from '@/lib/app-lock-context';
import { LockScreen } from '@/components/lock-screen';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ensurePermission, setupNotificationHandler } from '@/lib/notifications';
import { SelectedCategoryProvider } from '@/lib/selected-category-context';
import '../global.css';

setupNotificationHandler();

export const unstable_settings = {
  anchor: '(tabs)',
};

type ForegroundAlarm = {
  memoId: number;
  title: string;
  body: string;
};

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [alarm, setAlarm] = useState<ForegroundAlarm | null>(null);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  useEffect(() => {
    if (user) ensurePermission();
  }, [user]);

  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notif) => {
      const data = notif.request.content.data as { memoId?: number } | undefined;
      if (data?.memoId) {
        setAlarm({
          memoId: data.memoId,
          title: notif.request.content.title ?? '🔔 알림',
          body: notif.request.content.body ?? '',
        });
      }
    });
    const tappedSub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as { memoId?: number } | undefined;
      if (data?.memoId) {
        router.push(`/memo/${data.memoId}`);
      }
    });
    return () => {
      receivedSub.remove();
      tappedSub.remove();
    };
  }, [router]);

  function dismissAlarm() {
    setAlarm(null);
  }

  function viewAlarmMemo() {
    const id = alarm?.memoId;
    setAlarm(null);
    if (id) router.push(`/memo/${id}`);
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="trash" options={{ headerShown: true }} />
        <Stack.Screen name="add" options={{ headerShown: false }} />
      </Stack>
      <Modal visible={alarm !== null} transparent animationType="fade" onRequestClose={dismissAlarm}>
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-2xl p-5 w-full max-w-md">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              {alarm?.title}
            </Text>
            <Text className="text-[15px] text-gray-700 mb-5 leading-6">
              {alarm?.body}
            </Text>
            <Pressable
              onPress={viewAlarmMemo}
              className="bg-brand-500 rounded-2xl py-3 items-center active:bg-brand-600"
            >
              <Text className="text-white text-base font-semibold">메모 보기</Text>
            </Pressable>
            <Pressable
              onPress={dismissAlarm}
              className="mt-2 rounded-2xl py-3 items-center active:bg-gray-100"
            >
              <Text className="text-gray-700 text-base">닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppLockProvider>
        <AuthProvider>
          <SelectedCategoryProvider>
            <AuthGate />
            <StatusBar style="light" />
            <LockScreen />
          </SelectedCategoryProvider>
        </AuthProvider>
      </AppLockProvider>
    </ThemeProvider>
  );
}
