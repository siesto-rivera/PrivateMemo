'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { createMemo, getCategories } from '@/lib/api';
import { CATEGORY_EMOJI, type Category } from '@/lib/types';

export default function AddPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [hasAlarm, setHasAlarm] = useState(false);
  const [alarmDate, setAlarmDate] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await getCategories();
        if (!cancelled) {
          const sorted = [...cats].sort((a, b) => {
            if (a.name === '미분류') return -1;
            if (b.name === '미분류') return 1;
            return a.name.localeCompare(b.name, 'ko');
          });
          setCategories(sorted);
          if (sorted.length > 0) setCategory(sorted[0].name);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '카테고리를 불러오지 못했습니다');
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function addTag() {
    const t = tagDraft.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  }

  async function save() {
    if (!memo.trim()) {
      alert('메모 내용을 입력해주세요');
      return;
    }
    if (!category) {
      alert('카테고리를 선택해주세요');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createMemo({
        category_name: category,
        memo,
        alarm_date: hasAlarm ? alarmDate || null : null,
        tag: tags,
      });
      alert('저장되었습니다');
      setMemo('');
      setTags([]);
      setHasAlarm(false);
      setAlarmDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="새 메모" subtitle="기록하고 분류하세요">
      <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">카테고리</p>
      {loadingCats ? (
        <p className="text-sm text-gray-500 mb-5">로딩 중…</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
          {categories.map((c) => {
            const active = c.name === category;
            const emoji = c.emoji || CATEGORY_EMOJI[c.name] || '🏷️';
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.name)}
                className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-medium ${
                  active
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                {emoji} {c.name}
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">내용</p>
      <div className="bg-white rounded-2xl px-4 py-3 mb-5 border border-gray-100">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
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
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            placeholder="태그 추가"
            className="flex-1 text-[15px] text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={addTag}
          className="bg-gray-200 hover:bg-gray-300 rounded-2xl px-4 text-gray-700 text-sm font-semibold"
        >
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {tags.map((t) => (
          <button
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
        onClick={save}
        disabled={submitting}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 rounded-2xl py-4 text-white text-base font-semibold"
      >
        {submitting ? '저장 중…' : '메모 저장'}
      </button>
    </AppShell>
  );
}
