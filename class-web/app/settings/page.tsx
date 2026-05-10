'use client';

export const dynamic = 'force-dynamic';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { bulkImportMemos, deleteAccount, getMemos } from '@/lib/api';
import { csvToMemos, memosToCsv } from '@/lib/csv';

const PRIVACY_URL = 'https://memoapi.ngoworks.org/privacy/';
const APP_VERSION = '0.1.0';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  function onLogout() {
    logout();
    router.push('/login');
  }

  function openDelete() {
    setPassword('');
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function exportCsv() {
    if (busy) return;
    setBusy('export');
    try {
      const memos = await getMemos();
      const csv = memosToCsv(memos);
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memos-${todayStr()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(`${memos.length}개의 메모를 내보냈습니다.`);
    } catch (e) {
      alert(`내보내기 실패: ${e instanceof Error ? e.message : ''}`);
    } finally {
      setBusy(null);
    }
  }

  function pickImportFile() {
    if (busy) return;
    fileInputRef.current?.click();
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('import');
    try {
      const text = await file.text();
      const { rows, errors } = csvToMemos(text);
      if (rows.length === 0) {
        alert('가져올 메모가 없습니다.' + (errors.length ? `\n${errors[0]}` : ''));
        return;
      }
      const ok = confirm(
        `${rows.length}개의 메모를 가져옵니다.${errors.length ? ` (${errors.length}개 행 무시)` : ''}\n계속하시겠습니까?`,
      );
      if (!ok) return;

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
      alert(`${result.imported}개 가져옴${failMsg}`);
    } catch (e) {
      alert(`가져오기 실패: ${e instanceof Error ? e.message : ''}`);
    } finally {
      setBusy(null);
    }
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
        <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">데이터</p>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={exportCsv}
            disabled={busy !== null}
            className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50 disabled:opacity-50 text-left border-b border-gray-100"
          >
            <span className="text-base mr-3">📤</span>
            <span className="flex-1 text-[15px] text-gray-900">
              {busy === 'export' ? '내보내는 중…' : '데이터 내보내기 (CSV)'}
            </span>
            <span className="text-gray-300">›</span>
          </button>
          <button
            onClick={pickImportFile}
            disabled={busy !== null}
            className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50 disabled:opacity-50 text-left border-b border-gray-100"
          >
            <span className="text-base mr-3">📥</span>
            <span className="flex-1 text-[15px] text-gray-900">
              {busy === 'import' ? '가져오는 중…' : '데이터 가져오기 (CSV)'}
            </span>
            <span className="text-gray-300">›</span>
          </button>
          <Link
            href="/trash"
            className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50"
          >
            <span className="text-base mr-3">🗑️</span>
            <span className="flex-1 text-[15px] text-gray-900">휴지통</span>
            <span className="text-gray-300">›</span>
          </Link>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFilePicked}
          className="hidden"
        />
      </div>

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
