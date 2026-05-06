'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DEFAULT_CATEGORIES, CATEGORY_EMOJI } from '@/lib/mock-data';

export default function AddPage() {
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [memo, setMemo] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [hasAlarm, setHasAlarm] = useState(false);
  const [alarmDate, setAlarmDate] = useState('');

  function addTag() {
    const t = tagDraft.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft('');
  }

  function save() {
    if (!memo.trim()) {
      alert('메모 내용을 입력해주세요');
      return;
    }
    alert(`저장됨 (mock)\n${category}: ${memo.slice(0, 30)}…`);
    setMemo('');
    setTags([]);
    setHasAlarm(false);
    setAlarmDate('');
  }

  return (
    <AppShell title="새 메모" subtitle="기록하고 분류하세요">
      <p className="text-xs font-semibold text-gray-500 mb-2 ml-1">카테고리</p>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
        {DEFAULT_CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-medium ${
                active
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              {CATEGORY_EMOJI[c] ?? '🏷️'} {c}
            </button>
          );
        })}
      </div>

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

      <button
        onClick={save}
        className="w-full bg-brand-500 hover:bg-brand-600 rounded-2xl py-4 text-white text-base font-semibold"
      >
        메모 저장
      </button>
    </AppShell>
  );
}
