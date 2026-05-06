import React from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { ScreenHeader } from '@/components/screen-header';

type Row = {
  icon: string;
  label: string;
  hint?: string;
  toggle?: boolean;
};

const sections: { title: string; rows: Row[] }[] = [
  {
    title: '환경 설정',
    rows: [
      { icon: '🌙', label: '다크 모드', toggle: true },
      { icon: '🔔', label: '푸시 알림', hint: '허용됨', toggle: true },
      { icon: '🔒', label: '앱 잠금', hint: '꺼짐' },
    ],
  },
  {
    title: '데이터',
    rows: [
      { icon: '☁️', label: '백업 및 동기화', hint: '연결 안 됨' },
      { icon: '⬇️', label: '데이터 가져오기' },
      { icon: '⬆️', label: '데이터 내보내기' },
    ],
  },
  {
    title: '정보',
    rows: [
      { icon: '📄', label: '오픈소스 라이선스' },
      { icon: '✉️', label: '문의하기' },
      { icon: 'ℹ️', label: '버전', hint: '0.1.0 (UI 데모)' },
    ],
  },
];

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="설정" />
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 48 }}>
        {sections.map((s) => (
          <View key={s.title} className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 mb-2 ml-1">{s.title}</Text>
            <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {s.rows.map((r, i) => (
                <Pressable
                  key={r.label}
                  className={`flex-row items-center px-4 py-3.5 active:bg-gray-50 ${
                    i !== s.rows.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Text className="text-base mr-3">{r.icon}</Text>
                  <Text className="flex-1 text-[15px] text-gray-900">{r.label}</Text>
                  {r.toggle ? (
                    <Switch
                      value={r.label !== '앱 잠금'}
                      trackColor={{ true: '#7c3aed', false: '#d1d5db' }}
                    />
                  ) : (
                    <View className="flex-row items-center">
                      {r.hint ? (
                        <Text className="text-xs text-gray-400 mr-2">{r.hint}</Text>
                      ) : null}
                      <Text className="text-gray-300">›</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Text className="text-center text-[11px] text-gray-400 mt-2">
          지극히 사적인 메모장 · UI 데모
        </Text>
      </ScrollView>
    </View>
  );
}
