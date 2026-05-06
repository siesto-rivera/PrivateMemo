'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';

type Row = {
  icon: string;
  label: string;
  hint?: string;
  toggle?: boolean;
  on?: boolean;
};

const sections: { title: string; rows: Row[] }[] = [
  {
    title: '환경 설정',
    rows: [
      { icon: '🌙', label: '다크 모드', toggle: true, on: false },
      { icon: '🔔', label: '푸시 알림', hint: '허용됨', toggle: true, on: true },
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

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  function onLogout() {
    logout();
    router.push('/login');
  }

  return (
    <AppShell title="설정" subtitle={user?.email}>
      {sections.map((s) => (
        <div key={s.title} className="mb-6">
          <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">
            {s.title}
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {s.rows.map((r, i) => (
              <button
                key={r.label}
                className={`w-full flex items-center px-4 py-3.5 hover:bg-gray-50 text-left ${
                  i !== s.rows.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="text-base mr-3">{r.icon}</span>
                <span className="flex-1 text-[15px] text-gray-900">
                  {r.label}
                </span>
                {r.toggle ? (
                  <span
                    className={`w-10 h-6 rounded-full relative transition ${
                      r.on ? 'bg-brand-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
                        r.on ? 'left-[1.125rem]' : 'left-0.5'
                      }`}
                    />
                  </span>
                ) : (
                  <span className="flex items-center">
                    {r.hint ? (
                      <span className="text-xs text-gray-400 mr-2">{r.hint}</span>
                    ) : null}
                    <span className="text-gray-300">›</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">계정</p>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50 text-left"
          >
            <span className="text-base mr-3">🚪</span>
            <span className="flex-1 text-[15px] text-red-600">로그아웃</span>
            <span className="text-gray-300">›</span>
          </button>
        </div>
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-2">
        지극히 사적인 메모장 · UI 데모
      </p>
    </AppShell>
  );
}
