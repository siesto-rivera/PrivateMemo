'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { MemoCard } from '@/components/MemoCard';
import { getMemos } from '@/lib/api';
import type { Memo } from '@/lib/types';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const data = await getMemos();
      setMemos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메모를 불러오지 못했습니다');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMemos();
        if (!cancelled) setMemos(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '메모를 불러오지 못했습니다');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...memos].sort((a, b) =>
      b.createDate.localeCompare(a.createDate),
    );
    if (!q) return sorted;
    return sorted.filter(
      (m) =>
        m.memo.toLowerCase().includes(q) ||
        m.category_name.toLowerCase().includes(q) ||
        m.tag.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query, memos]);

  return (
    <AppShell
      title="지극히 사적인 메모장"
      subtitle={`총 ${memos.length}개의 메모`}
      headerRight={
        <Link
          href="/add"
          className="px-3 py-1.5 rounded-full bg-white/20 text-base text-white font-medium hover:bg-white/30 leading-none"
          aria-label="새 메모"
        >
          ＋
        </Link>
      }
    >
      <div className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100 flex items-center">
        <span className="text-base mr-2">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="메모, 카테고리, 태그 검색"
          className="flex-1 text-[15px] text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
        />
      </div>
      <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">최근 메모</p>
      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">로딩 중…</p>
      ) : error ? (
        <p className="text-red-600 text-sm py-4">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <span className="text-3xl mb-2">🗒️</span>
          <p className="text-sm text-gray-400">검색 결과가 없습니다</p>
        </div>
      ) : (
        filtered.map((m) => <MemoCard key={m.id} memo={m} onChanged={refetch} />)
      )}
    </AppShell>
  );
}
