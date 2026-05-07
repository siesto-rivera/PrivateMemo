import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ScreenHeader } from '@/components/screen-header';
import { useAuth } from '@/lib/auth-context';
import { bulkImportMemos, deleteAccount, getMemos } from '@/lib/api';
import { csvToMemos, memosToCsv } from '@/lib/csv';
import {
  getPermissionStatus,
  getScheduledCount,
  requestPermission,
  type PermissionStatus,
} from '@/lib/notifications';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PRIVACY_URL = 'https://memoapi.ngoworks.org/privacy/';
const APP_VERSION = '0.1.0';

const statusLabel: Record<PermissionStatus, string> = {
  granted: '허용됨',
  denied: '거부됨',
  undetermined: '미요청',
};

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [permission, setPermission] = useState<PermissionStatus>('undetermined');
  const [scheduledCount, setScheduledCount] = useState<number>(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  async function exportCsv() {
    if (busy) return;
    setBusy('export');
    try {
      const memos = await getMemos();
      const csv = memosToCsv(memos);
      const filename = `memos-${todayStr()}.csv`;
      const path = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, '﻿' + csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: 'text/csv',
          dialogTitle: '메모 CSV 내보내기',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('내보내기 완료', `파일이 저장되었습니다:\n${path}`);
      }
    } catch (e) {
      Alert.alert('내보내기 실패', e instanceof Error ? e.message : '');
    } finally {
      setBusy(null);
    }
  }

  async function importCsv() {
    if (busy) return;
    let pickedUri: string | null = null;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      pickedUri = res.assets[0].uri;
    } catch (e) {
      Alert.alert('파일 선택 실패', e instanceof Error ? e.message : '');
      return;
    }

    setBusy('import');
    try {
      const text = await FileSystem.readAsStringAsync(pickedUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const cleaned = text.replace(/^﻿/, '');
      const { rows, errors } = csvToMemos(cleaned);
      if (rows.length === 0) {
        Alert.alert(
          '가져올 메모가 없습니다',
          errors.length ? errors[0] : '파일이 비어있거나 형식이 잘못되었습니다.',
        );
        return;
      }

      await new Promise<void>((resolve, reject) => {
        Alert.alert(
          '메모 가져오기',
          `${rows.length}개의 메모를 가져옵니다.${
            errors.length ? ` (${errors.length}개 행 무시)` : ''
          }\n계속하시겠습니까?`,
          [
            { text: '취소', style: 'cancel', onPress: () => reject(new Error('cancelled')) },
            { text: '가져오기', onPress: () => resolve() },
          ],
        );
      }).catch(() => {
        throw new Error('cancelled');
      });

      const result = await bulkImportMemos(
        rows.map((r) => ({
          category_name: r.category_name,
          memo: r.memo,
          alarm_date: r.alarm_date,
          tag: r.tag,
        })),
      );
      const failMsg = result.errors.length
        ? `\n실패 ${result.errors.length}건 (예: ${result.errors[0].message.slice(0, 80)})`
        : '';
      Alert.alert('가져오기 완료', `${result.imported}개 가져옴${failMsg}`);
    } catch (e) {
      if (e instanceof Error && e.message === 'cancelled') return;
      Alert.alert('가져오기 실패', e instanceof Error ? e.message : '');
    } finally {
      setBusy(null);
    }
  }

  const refreshDiagnostics = useCallback(async () => {
    const [s, n] = await Promise.all([getPermissionStatus(), getScheduledCount()]);
    setPermission(s);
    setScheduledCount(n);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      refreshDiagnostics().then(() => {
        if (!active) return;
      });
      return () => {
        active = false;
      };
    }, [refreshDiagnostics]),
  );

  async function onTapPermission() {
    if (permission === 'granted') {
      Alert.alert('알림 권한', '이미 허용되어 있습니다.');
      return;
    }
    if (permission === 'undetermined') {
      const next = await requestPermission();
      setPermission(next);
      if (next === 'denied') {
        Alert.alert(
          '알림 권한이 거부되었습니다',
          '알림을 받으려면 시스템 설정에서 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정 열기', onPress: () => Linking.openSettings() },
          ],
        );
      }
      return;
    }
    Alert.alert('알림 권한 거부됨', '시스템 설정에서 허용해주세요.', [
      { text: '취소', style: 'cancel' },
      { text: '설정 열기', onPress: () => Linking.openSettings() },
    ]);
  }

  function onLogout() {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  function openDelete() {
    setDeletePassword('');
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deletePassword) {
      setDeleteError('비밀번호를 입력해주세요');
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      setDeleteOpen(false);
      await logout();
      router.replace('/(auth)/login');
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '삭제에 실패했습니다');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="설정" />
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 48 }}>
        {user ? (
          <View className="bg-white rounded-2xl px-4 py-4 mb-6 border border-gray-100 flex-row items-center">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-semibold text-gray-500 mb-1">계정</Text>
              <Text className="text-base font-semibold text-gray-900">{user.name}</Text>
              <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                {user.email}
              </Text>
            </View>
            <Pressable
              onPress={onLogout}
              hitSlop={6}
              className="px-3 py-1.5 rounded-full bg-red-50 active:bg-red-100"
            >
              <Text className="text-xs font-semibold text-red-500">로그아웃</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">알림</Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <Pressable
              onPress={onTapPermission}
              className="flex-row items-center px-4 py-3.5 active:bg-gray-50 border-b border-gray-100"
            >
              <Text className="text-base mr-3">🔔</Text>
              <Text className="flex-1 text-[15px] text-gray-900">푸시 알림 권한</Text>
              <Text
                className={`text-xs mr-2 ${
                  permission === 'granted'
                    ? 'text-brand-600'
                    : permission === 'denied'
                      ? 'text-red-500'
                      : 'text-gray-400'
                }`}
              >
                {statusLabel[permission]}
              </Text>
              <Text className="text-gray-300">›</Text>
            </Pressable>
            <View className="flex-row items-center px-4 py-3.5">
              <Text className="text-base mr-3">📋</Text>
              <Text className="flex-1 text-[15px] text-gray-900">예약된 알림</Text>
              <Text className="text-xs text-gray-400 mr-2">{scheduledCount}건</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">데이터</Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <Pressable
              onPress={exportCsv}
              disabled={busy !== null}
              className="flex-row items-center px-4 py-3.5 active:bg-gray-50 disabled:opacity-50 border-b border-gray-100"
            >
              <Text className="text-base mr-3">📤</Text>
              <Text className="flex-1 text-[15px] text-gray-900">
                {busy === 'export' ? '내보내는 중…' : '데이터 내보내기 (CSV)'}
              </Text>
              <Text className="text-gray-300">›</Text>
            </Pressable>
            <Pressable
              onPress={importCsv}
              disabled={busy !== null}
              className="flex-row items-center px-4 py-3.5 active:bg-gray-50 disabled:opacity-50 border-b border-gray-100"
            >
              <Text className="text-base mr-3">📥</Text>
              <Text className="flex-1 text-[15px] text-gray-900">
                {busy === 'import' ? '가져오는 중…' : '데이터 가져오기 (CSV)'}
              </Text>
              <Text className="text-gray-300">›</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/trash')}
              className="flex-row items-center px-4 py-3.5 active:bg-gray-50"
            >
              <Text className="text-base mr-3">🗑️</Text>
              <Text className="flex-1 text-[15px] text-gray-900">휴지통</Text>
              <Text className="text-gray-300">›</Text>
            </Pressable>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">정보</Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <Pressable
              onPress={() => Linking.openURL(PRIVACY_URL)}
              className="flex-row items-center px-4 py-3.5 active:bg-gray-50 border-b border-gray-100"
            >
              <Text className="text-base mr-3">📄</Text>
              <Text className="flex-1 text-[15px] text-gray-900">개인정보 처리방침</Text>
              <Text className="text-gray-300">↗</Text>
            </Pressable>
            <View className="flex-row items-center px-4 py-3.5">
              <Text className="text-base mr-3">ℹ️</Text>
              <Text className="flex-1 text-[15px] text-gray-900">버전</Text>
              <Text className="text-xs text-gray-400">{APP_VERSION}</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">위험 영역</Text>
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <Pressable
              onPress={openDelete}
              className="flex-row items-center px-4 py-3.5 active:bg-red-50"
            >
              <Text className="text-base mr-3">🗑️</Text>
              <Text className="flex-1 text-[15px] font-semibold text-red-500">계정 삭제</Text>
              <Text className="text-gray-300">›</Text>
            </Pressable>
          </View>
          <Text className="text-[11px] text-gray-400 mt-2 ml-1">
            계정을 삭제하면 모든 메모와 카테고리가 영구 삭제되며 복구할 수 없습니다.
          </Text>
        </View>

        <Text className="text-center text-[11px] text-gray-400 mt-2">
          지극히 사적인 메모장
        </Text>
      </ScrollView>

      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setDeleteOpen(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="bg-black/50 flex-1 justify-center items-center px-5">
            <View className="bg-white rounded-2xl p-5 w-full max-w-md">
              <Text className="text-base font-semibold text-gray-900 mb-2">계정 삭제</Text>
              <Text className="text-sm text-gray-700 mb-4 leading-6">
                계정과 모든 메모/카테고리가{' '}
                <Text className="text-red-600 font-semibold">영구 삭제</Text>되며 복구할 수
                없습니다. 계속하려면 비밀번호를 입력하세요.
              </Text>

              <View className="bg-gray-50 rounded-2xl px-4 py-3 mb-3 border border-gray-100">
                <TextInput
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  onSubmitEditing={confirmDelete}
                  placeholder="비밀번호"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  autoFocus
                  className="text-[15px] text-gray-900"
                />
              </View>

              {deleteError ? (
                <Text className="text-xs text-red-500 mb-3 ml-1">{deleteError}</Text>
              ) : null}

              <Pressable
                onPress={confirmDelete}
                disabled={deleting}
                className="bg-red-600 rounded-2xl py-3.5 items-center active:bg-red-700 disabled:opacity-50 mb-2"
              >
                <Text className="text-white text-base font-semibold">
                  {deleting ? '삭제 중…' : '계정 영구 삭제'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setDeleteOpen(false)}
                disabled={deleting}
                className="rounded-2xl py-3 items-center active:bg-gray-100 disabled:opacity-50"
              >
                <Text className="text-gray-600 text-base font-medium">취소</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
