'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MemoCard } from '@/components/MemoCard';
import {
  DEFAULT_CATEGORIES,
  MOCK_MEMOS,
  CATEGORY_EMOJI,
} from '@/lib/mock-data';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const counts = MOCK_MEMOS.reduce<Record<string, number>>((acc, m) => {
    acc[m.category_name] = (acc[m.category_name] ?? 0) + 1;
    return acc;
  }, {});

  function addCategory() {
    const name = draft.trim();
    if (!name) return;
    if (categories.includes(name)) {
      alert('이미 있는 카테고리입니다');
      return;
    }
    setCategories([...categories, name]);
    setDraft('');
  }

  const memos = selected
    ? MOCK_MEMOS.filter((m) => m.category_name === selected)
    : [];

  return (
    <AppShell
      title={selected ?? '카테고리'}
      subtitle={
        selected
          ? `${memos.length}개의 메모`
          : `${categories.length}개의 카테고리`
      }
      headerRight={
        selected ? (
          <button
            onClick={() => setSelected(null)}
            className="px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-600 hover:bg-gray-200"
          >
            ← 전체
          </button>
        ) : null
      }
    >
      {selected ? (
        memos.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-3xl mb-2">📭</span>
            <p className="text-sm text-gray-400">
              이 카테고리에는 아직 메모가 없습니다
            </p>
          </div>
        ) : (
          memos.map((m) => <MemoCard key={m.id} memo={m} />)
        )
      ) : (
        <>
          <div className="flex mb-4 gap-2">
            <div className="flex-1 bg-white rounded-2xl px-4 py-3 border border-gray-100 flex items-center">
              <span className="text-base mr-2">➕</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                placeholder="새 카테고리 이름"
                className="flex-1 text-[15px] text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={addCategory}
              className="bg-brand-500 hover:bg-brand-600 rounded-2xl px-4 text-white text-sm font-semibold"
            >
              추가
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {categories.map((c) => {
              const emoji = CATEGORY_EMOJI[c] ?? '🏷️';
              const cnt = counts[c] ?? 0;
              return (
                <button
                  key={c}
                  onClick={() => setSelected(c)}
                  className="bg-white rounded-2xl px-4 py-4 border border-gray-100 hover:bg-gray-50 text-left transition"
                >
                  <div className="text-2xl mb-1">{emoji}</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {c}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{cnt}개</div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
