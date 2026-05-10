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


function buildTrigger(
  memo: Memo,
  date: Date,
): Notifications.NotificationTriggerInput | null {
  const repeat = memo.repeat ?? 'none';
  if (repeat === 'none') {
    if (date.getTime() <= Date.now()) return null; // skip past one-shots
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    };
  }
  // Calendar trigger — recurring. iOS/Android schedule next occurrence
  // from now onwards based on (hour, minute, [weekday], [day]).
  const hour = date.getHours();
  const minute = date.getMinutes();
  if (repeat === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    };
  }
  if (repeat === 'weekly') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: date.getDay() + 1, // expo: 1=Sunday..7=Saturday
      hour,
      minute,
      repeats: true,
    };
  }
  if (repeat === 'monthly') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      day: date.getDate(),
      hour,
      minute,
      repeats: true,
    };
  }
  return null;
}


export async function syncAlarms(memos: Memo[]): Promise<void> {
  const granted = await ensurePermission();
  if (!granted) {
    console.log('[notifications] syncAlarms: permission not granted, skipping');
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  let scheduled = 0;
  for (const memo of memos) {
    if (!memo.alarm_date) continue;
    const date = new Date(memo.alarm_date);
    if (Number.isNaN(date.getTime())) continue;

    const trigger = buildTrigger(memo, date);
    if (!trigger) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `memo-${memo.id}`,
      content: {
        title: `🔔 ${memo.category_name}`,
        body: memo.memo.slice(0, 100),
        data: { memoId: memo.id },
        sound: 'default',
      },
      trigger,
    });
    scheduled++;
  }
  console.log(`[notifications] syncAlarms: scheduled ${scheduled} (of ${memos.length} memos)`);
}


export async function getScheduledCount(): Promise<number> {
  const list = await Notifications.getAllScheduledNotificationsAsync();
  return list.length;
}
