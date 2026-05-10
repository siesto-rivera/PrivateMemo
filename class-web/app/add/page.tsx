'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { createCategory, createMemo, getCategories } from '@/lib/api';
import { useSelectedCategory } from '@/lib/selected-category-context';
import { CATEGORY_EMOJI, REPEAT_LABELS, type Category, type Repeat } from '@/lib/types';

const REPEAT_OPTIONS: Repeat[] = ['none', 'daily', 'weekly', 'monthly'];

export default function AddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCalendar = searchParams.get('from') === 'calendar';
  const { selectedCategory } = useSelectedCategory();
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [hasSchedule, setHasSchedule] = useState(fromCalendar);
  const [scheduleDate, setScheduleDate] = useState('');
  const [hasAlarm, setHasAlarm] = useState(false);
  const [alarmDate, setAlarmDate] = useState('');
  const [repeat, setRepeat] = useState<Repeat>('none');
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newError, setNewError] = useState<string | null>(null);
  const [creatingCat, setCreatingCat] = useState(false);

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
          if (sorted.length > 0) {
            const initial =
              selectedCategory && sorted.some((c) => c.name === selectedCategory)
                ? selectedCategory
                : sorted[0].name;
            setCategory(initial);
          }
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
  }, [selectedCategory]);

  function addTag() {
    const t = tagDraft.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  }

  function openNewCategory() {
    setNewName('');
    setNewEmoji('');
    setNewError(null);
    setNewOpen(true);
  }

  async function submitNewCategory() {
    const name = newName.trim();
    if (!name) {
      setNewError('이름을 입력해주세요');
      return;
    }
    if (categories.some((c) => c.name === name)) {
      setNewError('이미 있는 카테고리입니다');
      return;
    }
    setCreatingCat(true);
    setNewError(null);
    try {
      const created = await createCategory({ name, emoji: newEmoji.trim() || undefined });
      const next = [...categories, created].sort((a, b) => {
        if (a.name === '미분류') return -1;
        if (b.name === '미분류') return 1;
        return a.name.localeCompare(b.name, 'ko');
      });
      setCategories(next);
      setCategory(created.name);
      setNewOpen(false);
    } catch (err) {
      setNewError(err instanceof Error ? err.message : '추가 실패');
    } finally {
      setCreatingCat(false);
    }
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
        schedule_date: hasSchedule ? scheduleDate || null : null,
        repeat: hasAlarm ? repeat : 'none',
        tag: tags,
      });
      setMemo('');
      setTags([]);
      setHasSchedule(false);
      setScheduleDate('');
      setHasAlarm(false);
      setAlarmDate('');
      setRepeat('none');
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="새 메모"
      subtitle="기록하고 분류하세요"
      headerLeft={
        <button
          onClick={() => {
            if (fromCalendar) {
              router.back();
              return;
            }
            if (selectedCategory) {
              router.push('/categories');
              return;
            }
            router.back();
          }}
          aria-label="뒤로가기"
          className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
        >
          <span className="text-2xl leading-none -mt-1">‹</span>
        </button>
      }
    >
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
          <button
            onClick={openNewCategory}
            className="shrink-0 px-3.5 py-2 rounded-full border border-dashed border-brand-400 text-xs font-medium text-brand-600 bg-white hover:bg-brand-50"
          >
            + 새 카테고리
          </button>
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
            <p className="text-sm font-semibold text-gray-900">📅 일정에 추가</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              선택한 날짜의 일정 캘린더에 표시됩니다
            </p>
          </div>
          <input
            type="checkbox"
            checked={hasSchedule}
            onChange={(e) => setHasSchedule(e.target.checked)}
            className="w-10 h-6 appearance-none bg-gray-300 rounded-full relative cursor-pointer transition checked:bg-brand-500 before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:w-5 before:h-5 before:bg-white before:rounded-full before:transition checked:before:translate-x-4"
          />
        </label>
        {hasSchedule ? (
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="mt-3 w-full bg-gray-50 rounded-xl px-3 py-2 text-[14px] text-gray-900 outline-none"
          />
        ) : null}
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
          <>
            <input
              type="datetime-local"
              value={alarmDate}
              onChange={(e) => setAlarmDate(e.target.value)}
              className="mt-3 w-full bg-gray-50 rounded-xl px-3 py-2 text-[14px] text-gray-900 outline-none"
            />
            <div className="flex gap-1 mt-3">
              {REPEAT_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRepeat(r)}
                  className={`flex-1 px-3 py-2 rounded-full border text-xs font-medium ${
                    r === repeat
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  {REPEAT_LABELS[r]}
                </button>
              ))}
            </div>
          </>
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

      {newOpen ? (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => !creatingCat && setNewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">새 카테고리</h2>

            <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">이름</p>
            <div className="bg-white rounded-2xl px-4 py-3 mb-3 border border-gray-100">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitNewCategory()}
                placeholder="카테고리 이름"
                autoFocus
                className="w-full text-[15px] text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>

            <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">이모지 (선택)</p>
            <div className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100 inline-flex">
              <input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                placeholder="🏷️"
                maxLength={4}
                className="w-[4ch] text-[20px] text-gray-900 outline-none bg-transparent placeholder:text-gray-400 text-center"
              />
            </div>

            {newError ? <p className="text-red-600 text-sm mb-3">{newError}</p> : null}

            <button
              type="button"
              onClick={submitNewCategory}
              disabled={creatingCat}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl py-3 font-semibold mb-2"
            >
              {creatingCat ? '추가 중…' : '추가'}
            </button>
            <button
              type="button"
              onClick={() => setNewOpen(false)}
              disabled={creatingCat}
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
