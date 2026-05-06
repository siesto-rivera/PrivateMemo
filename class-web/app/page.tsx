'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { MemoCard } from '@/components/MemoCard';
import { MOCK_MEMOS } from '@/lib/mock-data';

export default function HomePage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...MOCK_MEMOS].sort((a, b) =>
      b.createDate.localeCompare(a.createDate),
    );
    if (!q) return sorted;
    return sorted.filter(
      (m) =>
        m.memo.toLowerCase().includes(q) ||
        m.category_name.toLowerCase().includes(q) ||
        m.tag.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <AppShell
      title="지극히 사적인 메모장"
      subtitle={`총 ${MOCK_MEMOS.length}개의 메모`}
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
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <span className="text-3xl mb-2">🗒️</span>
          <p className="text-sm text-gray-400">검색 결과가 없습니다</p>
        </div>
      ) : (
        filtered.map((m) => <MemoCard key={m.id} memo={m} />)
      )}
    </AppShell>
  );
}
