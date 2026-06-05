'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { deleteMemo, getCategories, updateMemo } from '@/lib/api';
import {
  CATEGORY_EMOJI,
  REPEAT_LABELS,
  formatDate,
  stickyPalette,
  type Category,
  type Memo,
  type Repeat,
} from '@/lib/types';

const REPEAT_OPTIONS: Repeat[] = ['none', 'daily', 'weekly', 'monthly'];

type Props = { memo: Memo; onChanged?: () => void; highlighted?: boolean };

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STICKY_TILTS = [-0.8, 0.7, -0.5, 0.9, -0.6];

export function MemoCard({ memo, highlighted = false }: Props) {
  const pathname = usePathname();
  const tilt = STICKY_TILTS[memo.id % STICKY_TILTS.length];
  const palette = stickyPalette(memo.category_name);

  return (
    <Link
      href={`/memo/${memo.id}?from=${encodeURIComponent(pathname)}`}
      className="block w-full text-left rounded-md px-4 py-3.5 cursor-pointer transition hover:brightness-95"
      style={{
        backgroundColor: palette.bg,
        borderColor: highlighted ? '#7c3aed' : palette.border,
        borderWidth: highlighted ? 2 : 1,
        borderStyle: 'solid',
        transform: `rotate(${tilt}deg)`,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06)',
      }}
    >
      {(memo.images && memo.images.length > 0) || memo.alarm_date ? (
        <div className="flex items-center mb-1.5">
          {memo.images && memo.images.length > 0 ? (
            <span
              className="bg-white/60 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full"
              title="사진은 작성한 모바일 기기의 사진 앱에서 확인할 수 있습니다"
            >
              📷 {memo.images.length}
            </span>
          ) : null}
          {memo.alarm_date ? (
            <span
              className={`${memo.images && memo.images.length > 0 ? 'ml-1' : ''} bg-white/70 text-amber-800 text-[10px] font-medium px-2 py-0.5 rounded-full`}
            >
              🔔 {formatDate(memo.alarm_date)}
              {memo.repeat && memo.repeat !== 'none' ? ` 🔁 ${REPEAT_LABELS[memo.repeat]}` : ''}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="text-[15px] text-gray-800 leading-5 line-clamp-2 prose prose-sm max-w-none [&>*]:m-0 [&_p]:m-0 [&_ul]:m-0 [&_li]:m-0">
        <ReactMarkdown>{memo.memo}</ReactMarkdown>
      </div>
      <div className="flex flex-wrap items-center mt-2 gap-1.5">
        {memo.tag.map((t) => (
          <span
            key={t}
            className="bg-white/60 text-gray-700 text-[11px] px-2 py-0.5 rounded-full"
          >
            #{t}
          </span>
        ))}
        {memo.schedule_date ? (
          <span className="ml-auto text-[11px] text-gray-500">
            📅 {memo.schedule_date.replace(/-/g, '.')}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function MemoEditModal({
  memo,
  onClose,
  onSaved,
  onDeleted,
}: {
  memo: Memo;
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [category, setCategory] = useState<string>(memo.category_name);
  const [memoText, setMemoText] = useState<string>(memo.memo);
  const [tags, setTags] = useState<string[]>(memo.tag);
  const [tagDraft, setTagDraft] = useState('');
  const [hasSchedule, setHasSchedule] = useState<boolean>(!!memo.schedule_date);
  const [scheduleDate, setScheduleDate] = useState<string>(memo.schedule_date ?? '');
  const [hasAlarm, setHasAlarm] = useState<boolean>(!!memo.alarm_date);
  const [alarmDate, setAlarmDate] = useState<string>(toDatetimeLocal(memo.alarm_date));
  const [repeat, setRepeat] = useState<Repeat>(memo.repeat ?? 'none');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (saving || deleting) return;
    onClose();
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, deleting]);

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
        schedule_date: hasSchedule ? scheduleDate || null : null,
        repeat: hasAlarm ? repeat : 'none',
        tag: tags,
      });
      onSaved?.();
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
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">메모 수정</h2>
          <button
            type="button"
            onClick={close}
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
          type="button"
          onClick={save}
          disabled={saving || deleting}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-2xl py-3 font-semibold mb-2"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
        <button
          type="button"
          onClick={close}
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
  );
}
