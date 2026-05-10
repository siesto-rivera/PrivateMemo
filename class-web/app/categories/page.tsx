'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { MemoCard } from '@/components/MemoCard';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getMemos,
  mergeCategory,
  updateCategory,
} from '@/lib/api';
import { useSelectedCategory } from '@/lib/selected-category-context';
import { CATEGORY_EMOJI, type Category, type Memo } from '@/lib/types';

export default function CategoriesPage() {
  const router = useRouter();
  const { selectedCategory, setSelectedCategory } = useSelectedCategory();
  const [categories, setCategories] = useState<Category[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selected, setSelected] = useState<string | null>(selectedCategory);

  function selectCategory(name: string | null) {
    setSelected(name);
    setSelectedCategory(name);
  }
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [merging, setMerging] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const [cats, ms] = await Promise.all([getCategories(), getMemos()]);
      setCategories(cats);
      setMemos(ms);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오지 못했습니다');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, ms] = await Promise.all([getCategories(), getMemos()]);
        if (!cancelled) {
          setCategories(cats);
          setMemos(ms);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '불러오지 못했습니다');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !savingEdit) setEditing(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, savingEdit]);

  const counts = memos.reduce<Record<string, number>>((acc, m) => {
    acc[m.category_name] = (acc[m.category_name] ?? 0) + 1;
    return acc;
  }, {});

  async function addCategory() {
    const name = draft.trim();
    if (!name) return;
    if (categories.some((c) => c.name === name)) {
      alert('이미 있는 카테고리입니다');
      return;
    }
    try {
      await createCategory({ name });
      const cats = await getCategories();
      setCategories(cats);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '카테고리 추가에 실패했습니다');
    }
  }

  async function removeCategory(c: Category) {
    const cnt = counts[c.name] ?? 0;
    const message =
      cnt > 0
        ? `"${c.name}" 카테고리를 삭제하시겠습니까?\n메모 ${cnt}개는 '미분류'로 이동됩니다.`
        : `"${c.name}" 카테고리를 삭제하시겠습니까?`;
    if (!confirm(message)) return;
    try {
      await deleteCategory(c.id);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : '카테고리 삭제에 실패했습니다');
    }
  }

  function openEdit(c: Category) {
    setEditing(c);
    setEditName(c.name);
    setEditEmoji(c.emoji ?? '');
    setEditError(null);
    setMergeTargetId('');
  }

  function closeEdit() {
    if (savingEdit || merging) return;
    setEditing(null);
  }

  async function runMerge() {
    if (!editing || !mergeTargetId) return;
    const target = categories.find((c) => String(c.id) === mergeTargetId);
    if (!target) return;
    const cnt = counts[editing.name] ?? 0;
    const ok = confirm(
      `"${editing.name}"의 메모 ${cnt}개를 "${target.name}"(으)로 이동하고\n"${editing.name}" 카테고리는 삭제됩니다. 계속하시겠습니까?`,
    );
    if (!ok) return;
    setEditError(null);
    setMerging(true);
    try {
      await mergeCategory(editing.id, target.id);
      setEditing(null);
      await refetch();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '통합에 실패했습니다');
    } finally {
      setMerging(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const name = editName.trim();
    if (!name) {
      setEditError('이름을 입력해주세요');
      return;
    }
    setEditError(null);
    setSavingEdit(true);
    try {
      await updateCategory(editing.id, { name, emoji: editEmoji });
      setEditing(null);
      await refetch();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setSavingEdit(false);
    }
  }

  const filteredMemos = selected
    ? memos.filter((m) => m.category_name === selected)
    : [];

  return (
    <AppShell
      title={selected ?? '카테고리'}
      subtitle={
        selected
          ? `${filteredMemos.length}개의 메모`
          : `${categories.length}개의 카테고리`
      }
      headerLeft={
        selected ? (
          <button
            onClick={() => selectCategory(null)}
            aria-label="뒤로가기"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
          >
            <span className="text-2xl leading-none -mt-1">‹</span>
          </button>
        ) : null
      }
      headerRight={
        selected ? (
          <button
            onClick={() => router.push('/add')}
            aria-label="새 메모"
            className="px-4 py-2 rounded-full bg-white text-brand-600 text-xs font-bold flex items-center gap-1 hover:bg-gray-100 shadow-md"
          >
            <span className="text-base font-bold leading-none">＋</span>
            <span className="leading-none">새 메모</span>
          </button>
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">로딩 중…</p>
      ) : selected ? (
        filteredMemos.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-3xl mb-2">📭</span>
            <p className="text-sm text-gray-400">
              이 카테고리에는 아직 메모가 없습니다
            </p>
          </div>
        ) : (
          filteredMemos.map((m) => <MemoCard key={m.id} memo={m} onChanged={refetch} />)
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

          {error ? <p className="text-red-600 text-sm mb-3">{error}</p> : null}

          <div className="grid grid-cols-2 gap-2">
            {categories.map((c) => {
              const emoji = c.emoji || CATEGORY_EMOJI[c.name] || '🏷️';
              const cnt = counts[c.name] ?? 0;
              const protectedCat = c.name === '미분류';
              return (
                <div key={c.id} className="relative">
                  <button
                    onClick={() => selectCategory(c.name)}
                    className="w-full bg-white rounded-2xl px-4 py-4 border border-gray-100 hover:bg-gray-50 text-left transition"
                  >
                    <div className="text-2xl mb-1">{emoji}</div>
                    <div className="text-sm font-semibold text-gray-900 truncate pr-14">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{cnt}개</div>
                  </button>
                  {protectedCat ? null : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(c);
                        }}
                        aria-label={`${c.name} 수정`}
                        className="absolute top-2 right-10 w-6 h-6 rounded-full bg-gray-100 hover:bg-brand-100 hover:text-brand-700 text-gray-500 text-xs leading-none flex items-center justify-center"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCategory(c);
                        }}
                        aria-label={`${c.name} 삭제`}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 text-base leading-none flex items-center justify-center"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {editing ? (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeEdit}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">카테고리 수정</h2>
              <button
                type="button"
                onClick={closeEdit}
                aria-label="닫기"
                className="ml-auto w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-base leading-none flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">이름</p>
            <div className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="카테고리 이름"
                className="w-full text-[15px] text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>

            <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">이모지</p>
            <div className="bg-white rounded-2xl px-4 py-3 mb-5 border border-gray-100 inline-flex">
              <input
                value={editEmoji}
                onChange={(e) => setEditEmoji(e.target.value)}
                placeholder="🏷️"
                maxLength={4}
                className="w-[4ch] text-[20px] text-gray-900 outline-none bg-transparent placeholder:text-gray-400 text-center"
              />
            </div>

            {editError ? (
              <p className="text-red-600 text-sm mb-3">{editError}</p>
            ) : null}

            <button
              type="button"
              onClick={saveEdit}
              disabled={savingEdit || merging}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl py-3 font-semibold mb-2"
            >
              {savingEdit ? '저장 중…' : '저장'}
            </button>

            <div className="my-5 flex items-center">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-[11px] text-gray-400">또는</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">다른 카테고리로 통합</p>
            <p className="text-[11px] text-gray-400 mb-2 ml-1">
              이 카테고리의 메모를 선택한 카테고리로 이동하고 이 카테고리는 삭제됩니다.
            </p>
            <select
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
              disabled={merging}
              className="w-full bg-white rounded-2xl px-4 py-3 mb-2 border border-gray-100 text-[15px] text-gray-900 outline-none"
            >
              <option value="">대상 카테고리 선택…</option>
              {categories
                .filter((c) => editing && c.id !== editing.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji || '🏷️'} {c.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={runMerge}
              disabled={!mergeTargetId || merging || savingEdit}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-2xl py-3 font-semibold mb-4"
            >
              {merging ? '통합 중…' : '통합'}
            </button>

            <button
              type="button"
              onClick={closeEdit}
              disabled={savingEdit || merging}
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
