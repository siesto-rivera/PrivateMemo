import * as Notifications from 'expo-notifications';

import type { Memo } from './types';


export function setupNotificationHandler() {
  // Foreground 알림은 OS 배너 대신 in-app 모달로 표시 (자동으로 사라지지 않음).
  // 백그라운드/잠금화면에서는 OS가 알림을 그대로 표시.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: true,
    }),
  });
}


export type PermissionStatus = 'granted' | 'denied' | 'undetermined';


export async function getPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}


export async function requestPermission(): Promise<PermissionStatus> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}


export async function ensurePermission(): Promise<boolean> {
  const existing = await getPermissionStatus();
  if (existing === 'granted') return true;
  if (existing === 'denied') return false;
  const next = await requestPermission();
  return next === 'granted';
}


export async function syncAlarms(memos: Memo[]): Promise<void> {
  const granted = await ensurePermission();
  if (!granted) {
    console.log('[notifications] syncAlarms: permission not granted, skipping');
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  let scheduled = 0;
  for (const memo of memos) {
    if (!memo.alarm_date) continue;
    const date = new Date(memo.alarm_date);
    const ms = date.getTime();
    if (Number.isNaN(ms) || ms <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `memo-${memo.id}`,
      content: {
        title: `🔔 ${memo.category_name}`,
        body: memo.memo.slice(0, 100),
        data: { memoId: memo.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
    scheduled++;
  }
  console.log(`[notifications] syncAlarms: scheduled ${scheduled} (of ${memos.length} memos)`);
}


export async function getScheduledCount(): Promise<number> {
  const list = await Notifications.getAllScheduledNotificationsAsync();
  return list.length;
}


export async function scheduleTestIn(seconds: number): Promise<string> {
  const ok = await ensurePermission();
  if (!ok) throw new Error('알림 권한이 없습니다');
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 테스트 알림',
      body: `${seconds}초 뒤 알림 — 정상 작동 확인`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
  console.log(`[notifications] scheduleTestIn: scheduled in ${seconds}s, id=${id}`);
  return id;
}
