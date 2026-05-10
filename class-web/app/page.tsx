'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { MemoCard } from '@/components/MemoCard';
import { getMemosPaginated } from '@/lib/api';
import type { Memo } from '@/lib/types';

const PAGE_SIZE = 30;

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadInitial = useCallback(async () => {
    setError(null);
    try {
      const data = await getMemosPaginated(1, PAGE_SIZE);
      setMemos(data.results);
      setHasNext(data.has_next);
      setCount(data.count);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메모를 불러오지 못했습니다');
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await getMemosPaginated(next, PAGE_SIZE);
      setMemos((prev) => [...prev, ...data.results]);
      setHasNext(data.has_next);
      setCount(data.count);
      setPage(next);
    } catch {
      // ignore — user can scroll again
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasNext, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadInitial();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadInitial]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || query.trim() || !hasNext) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '120px' },
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore, query, hasNext]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return memos;
    return memos.filter(
      (m) =>
        m.memo.toLowerCase().includes(q) ||
        m.category_name.toLowerCase().includes(q) ||
        m.tag.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query, memos]);

  return (
    <AppShell
      title="지극히 사적인 메모장"
      subtitle={`총 ${count}개의 메모`}
      headerRight={
        <Link
          href="/add"
          className="px-4 py-2 rounded-full bg-white text-brand-600 text-xs font-bold flex items-center gap-1 hover:bg-gray-100 shadow-md"
          aria-label="새 메모"
        >
          <span className="text-base font-bold leading-none">＋</span>
          <span className="leading-none">새 메모</span>
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
      <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">
        {query.trim() ? `검색 결과 ${filtered.length}건` : '최근 메모'}
      </p>
      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">로딩 중…</p>
      ) : error ? (
        <p className="text-red-600 text-sm py-4">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <span className="text-3xl mb-2">🗒️</span>
          <p className="text-sm text-gray-400">
            {query ? '검색 결과가 없습니다' : '아직 메모가 없습니다'}
          </p>
        </div>
      ) : (
        <>
          {filtered.map((m) => (
            <MemoCard key={m.id} memo={m} />
          ))}
          {!query.trim() ? (
            <>
              <div ref={sentinelRef} />
              {loadingMore ? (
                <p className="text-center text-xs text-gray-400 py-4">로딩 중…</p>
              ) : !hasNext && memos.length > 0 ? (
                <p className="text-center text-[11px] text-gray-400 py-4">
                  마지막 메모입니다
                </p>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
