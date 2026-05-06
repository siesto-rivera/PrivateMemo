'use client';

import { useEffect, useState } from 'react';
import { deleteMemo, getCategories, updateMemo } from '@/lib/api';
import { CATEGORY_EMOJI, formatDate, type Category, type Memo } from '@/lib/types';

type Props = { memo: Memo; onChanged?: () => void };

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MemoCard({ memo, onChanged }: Props) {
  const emoji = CATEGORY_EMOJI[memo.category_name] ?? '📝';
  const [isOpen, setIsOpen] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [category, setCategory] = useState<string>(memo.category_name);
  const [memoText, setMemoText] = useState<string>(memo.memo);
  const [tags, setTags] = useState<string[]>(memo.tag);
  const [tagDraft, setTagDraft] = useState('');
  const [hasAlarm, setHasAlarm] = useState<boolean>(!!memo.alarm_date);
  const [alarmDate, setAlarmDate] = useState<string>(toDatetimeLocal(memo.alarm_date));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setCategory(memo.category_name);
    setMemoText(memo.memo);
    setTags(memo.tag);
    setTagDraft('');
    setHasAlarm(!!memo.alarm_date);
    setAlarmDate(toDatetimeLocal(memo.alarm_date));
    setError(null);
    setIsOpen(true);
  }

  function closeModal() {
    if (saving || deleting) return;
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoadingCats(true);
      try {
        const cats = await getCategories();
        if (cancelled) return;
        const sorted = [...cats].sort((a, b) => {
          if (a.name === '미분류') return -1;
          if (b.name === '미분류') return 1;
          return a.name.localeCompare(b.name, 'ko');
        });
        setCategories(sorted);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '카테고리를 불러오지 못했습니다');
        }
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, saving, deleting]);

  function addTag() {
    const t = tagDraft.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  }

  async function save() {
    if (!memoText.trim()) {
      setError('메모 내용을 입력해주세요');
      return;
    }
    if (!category) {
      setError('카테고리를 선택해주세요');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateMemo(memo.id, {
        category_name: category,
        memo: memoText,
        alarm_date: hasAlarm ? alarmDate || null : null,
        tag: tags,
      });
      setIsOpen(false);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;
    setError(null);
    setDeleting(true);
    try {
      await deleteMemo(memo.id);
      setIsOpen(false);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="block w-full text-left bg-white rounded-2xl px-4 py-3.5 mb-3 border border-gray-100 hover:bg-gray-50 cursor-pointer transition"
      >
        <div className="flex items-center mb-1.5">
          <span className="text-lg mr-2">{emoji}</span>
          <span className="text-xs font-semibold text-brand-600">{memo.category_name}</span>
          {memo.alarm_date ? (
            <span className="ml-auto bg-amber-50 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
              🔔 {formatDate(memo.alarm_date)}
            </span>
          ) : null}
        </div>
        <p className="text-[15px] text-gray-900 leading-5 line-clamp-2">{memo.memo}</p>
        <div className="flex flex-wrap items-center mt-2 gap-1.5">
          {memo.tag.map((t) => (
            <span
              key={t}
              className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full"
            >
              #{t}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-gray-400">
            {formatDate(memo.createDate)}
          </span>
        </div>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">메모 수정</h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="닫기"
                className="ml-auto w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-base leading-none flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">카테고리</p>
            {loadingCats ? (
              <p className="text-sm text-gray-500 mb-5">로딩 중…</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
                {categories.map((c) => {
                  const active = c.name === category;
                  const catEmoji = c.emoji || CATEGORY_EMOJI[c.name] || '🏷️';
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategory(c.name)}
                      className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-medium ${
                        active
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-white border-gray-200 text-gray-700'
                      }`}
                    >
                      {catEmoji} {c.name}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">내용</p>
            <div className="bg-white rounded-2xl px-4 py-3 mb-5 border border-gray-100">
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="제목, URL, 메모 내용 등"
                className="w-full text-[15px] text-gray-900 outline-none bg-transparent placeholder:text-gray-400 min-h-[100px] resize-none"
              />
            </div>

            <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">태그</p>
            <div className="flex mb-2 gap-2">
              <div className="flex-1 bg-white rounded-2xl px-4 py-3 border border-gray-100 flex items-center">
                <span className="text-base mr-2 text-gray-400">#</span>
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="태그 추가"
                  className="flex-1 text-[15px] text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
                />
              </div>
              <button
                type="button"
                onClick={addTag}
                className="bg-gray-200 hover:bg-gray-300 rounded-2xl px-4 text-gray-700 text-sm font-semibold"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {tags.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-[12px] hover:bg-brand-100"
                >
                  #{t} ✕
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl px-4 py-3 mb-5 border border-gray-100">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-gray-900">🔔 알림 예약</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    지정한 날짜에 푸시 알림을 받습니다
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasAlarm}
                  onChange={(e) => setHasAlarm(e.target.checked)}
                  className="w-10 h-6 appearance-none bg-gray-300 rounded-full relative cursor-pointer transition checked:bg-brand-500 before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-5 before:h-5 before:bg-white before:rounded-full before:transition checked:before:translate-x-4"
                />
              </label>
              {hasAlarm ? (
                <input
                  type="datetime-local"
                  value={alarmDate}
                  onChange={(e) => setAlarmDate(e.target.value)}
                  className="mt-3 w-full bg-gray-50 rounded-xl px-3 py-2 text-[14px] text-gray-900 outline-none"
                />
              ) : null}
            </div>

            {error ? <p className="text-red-600 text-sm mb-3">{error}</p> : null}

            <button
              type="button"
              onClick={save}
              disabled={saving || deleting}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl py-3 font-semibold mb-2"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              disabled={saving || deleting}
              className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 rounded-2xl py-3 font-semibold mb-3"
            >
              취소
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={remove}
                disabled={saving || deleting}
                className="text-red-600 text-sm disabled:opacity-60"
              >
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
