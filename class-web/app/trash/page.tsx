'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { emptyTrash, forceDeleteMemo, getTrash, restoreMemo } from '@/lib/api';
import { CATEGORY_EMOJI, formatDate, type Memo } from '@/lib/types';

export default function TrashPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setMemos(await getTrash());
    } catch (e) {
      setError(e instanceof Error ? e.message : '휴지통을 불러오지 못했습니다');
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onRestore(m: Memo) {
    try {
      await restoreMemo(m.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '복원 실패');
    }
  }

  async function onForceDelete(m: Memo) {
    if (!confirm(`이 메모를 영구 삭제합니다. 복구할 수 없습니다. 계속하시겠습니까?`)) return;
    try {
      await forceDeleteMemo(m.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패');
    }
  }

  async function onEmpty() {
    if (memos.length === 0) return;
    if (!confirm(`${memos.length}개의 메모가 영구 삭제됩니다. 복구할 수 없습니다. 계속하시겠습니까?`)) return;
    try {
      await emptyTrash();
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '실패');
    }
  }

  return (
    <AppShell title="휴지통">
      {loading ? (
        <p className="text-sm text-gray-400 py-12 text-center">로딩 중…</p>
      ) : error ? (
        <p className="text-sm text-red-500 py-12 text-center">{error}</p>
      ) : memos.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <span className="text-3xl mb-2">🗑️</span>
          <p className="text-sm text-gray-400">휴지통이 비어있습니다</p>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-gray-400 mb-3 ml-1">
            30일이 지나면 자동으로 영구 삭제됩니다.
          </p>
          <button
            onClick={onEmpty}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl py-2.5 text-sm font-semibold mb-4"
          >
            휴지통 비우기 ({memos.length}개)
          </button>
          {memos.map((m) => {
            const emoji = CATEGORY_EMOJI[m.category_name] ?? '📝';
            return (
              <div key={m.id} className="bg-white rounded-2xl px-4 py-3.5 mb-3 border border-gray-100">
                <div className="flex items-center mb-1">
                  <span className="text-base mr-2">{emoji}</span>
                  <span className="text-xs font-semibold text-gray-500">{m.category_name}</span>
                  <span className="text-[11px] text-gray-400 ml-auto">
                    {formatDate(m.createDate)}
                  </span>
                </div>
                <p className="text-[14px] text-gray-700 leading-5 mb-2 line-clamp-2">{m.memo}</p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => onRestore(m)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2 text-xs font-semibold"
                  >
                    복원
                  </button>
                  <button
                    onClick={() => onForceDelete(m)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-2 text-xs font-semibold"
                  >
                    영구 삭제
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </AppShell>
  );
}
