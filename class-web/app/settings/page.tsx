'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { deleteAccount } from '@/lib/api';

const PRIVACY_URL = 'https://memoapi.ngoworks.org/privacy/';
const APP_VERSION = '0.1.0';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function onLogout() {
    logout();
    router.push('/login');
  }

  function openDelete() {
    setPassword('');
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!password) {
      setDeleteError('비밀번호를 입력해주세요');
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount(password);
      logout();
      router.push('/login');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '삭제에 실패했습니다');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="설정">
      {user ? (
        <div className="bg-white rounded-2xl px-4 py-4 mb-6 border border-gray-100 flex items-center">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">계정</p>
            <p className="text-base font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-600 shrink-0"
          >
            로그아웃
          </button>
        </div>
      ) : null}

      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">정보</p>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50"
          >
            <span className="text-base mr-3">📄</span>
            <span className="flex-1 text-[15px] text-gray-900">개인정보 처리방침</span>
            <span className="text-gray-300">↗</span>
          </a>
          <div className="flex items-center px-4 py-3.5 border-t border-gray-100">
            <span className="text-base mr-3">ℹ️</span>
            <span className="flex-1 text-[15px] text-gray-900">버전</span>
            <span className="text-xs text-gray-400">{APP_VERSION}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">위험 영역</p>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={openDelete}
            className="w-full flex items-center px-4 py-3.5 hover:bg-red-50 text-left"
          >
            <span className="text-base mr-3">🗑️</span>
            <span className="flex-1 text-[15px] font-semibold text-red-600">
              계정 삭제
            </span>
            <span className="text-gray-300">›</span>
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 ml-1">
          계정을 삭제하면 모든 메모와 카테고리가 영구 삭제되며 복구할 수 없습니다.
        </p>
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-2">
        지극히 사적인 메모장
      </p>

      {deleteOpen ? (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">계정 삭제</h2>
            <p className="text-sm text-gray-700 mb-4 leading-6">
              계정과 모든 메모/카테고리가 <strong className="text-red-600">영구 삭제</strong>되며
              복구할 수 없습니다. 계속하려면 비밀번호를 입력하세요.
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
              placeholder="비밀번호"
              autoFocus
              className="w-full bg-gray-50 rounded-2xl px-4 py-3 mb-3 border border-gray-100 text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
            />

            {deleteError ? (
              <p className="text-red-600 text-sm mb-3">{deleteError}</p>
            ) : null}

            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-2xl py-3 font-semibold mb-2"
            >
              {deleting ? '삭제 중…' : '계정 영구 삭제'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 rounded-2xl py-3 font-semibold"
            >
              취소
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
