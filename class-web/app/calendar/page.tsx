'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { AppShell } from '@/components/AppShell';
import { MemoCard } from '@/components/MemoCard';
import { getMemos } from '@/lib/api';
import type { Memo } from '@/lib/types';

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [cursor, setCursor] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setMemos(await getMemos());
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMemos();
        if (!cancelled) setMemos(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduledByDay = useMemo(() => {
    const map = new Map<string, Memo[]>();
    for (const m of memos) {
      if (!m.schedule_date) continue;
      if (!map.has(m.schedule_date)) map.set(m.schedule_date, []);
      map.get(m.schedule_date)!.push(m);
    }
    return map;
  }, [memos]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const out: Date[] = [];
    let d = start;
    while (d <= end) {
      out.push(d);
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return out;
  }, [cursor]);

  const monthKey = format(cursor, 'yyyy-MM');
  const monthMemos = useMemo(
    () =>
      memos
        .filter((m) => (m.schedule_date ?? '').startsWith(monthKey))
        .sort((a, b) => (a.schedule_date ?? '').localeCompare(b.schedule_date ?? '')),
    [memos, monthKey],
  );
  const selectedKey = dateKey(selected);
  const listTitle = `${format(cursor, 'yyyy년 M월')} 일정 ${monthMemos.length}건`;

  return (
    <AppShell title="일정" subtitle={`총 ${memos.filter((m) => m.schedule_date).length}개의 일정`}>
      <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setCursor(subMonths(cursor, 1))}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center"
            aria-label="이전 달"
          >
            ‹
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {format(cursor, 'yyyy년 M월')}
          </h2>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {KO_DOW.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[11px] py-1 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((d) => {
            const inMonth = isSameMonth(d, cursor);
            const isSelected = isSameDay(d, selected);
            const isToday = isSameDay(d, new Date());
            const has = scheduledByDay.has(dateKey(d));
            return (
              <button
                key={d.toISOString()}
                onClick={() => {
                  setSelected(d);
                  setCursor(d);
                }}
                className={`relative aspect-square flex flex-col items-center justify-center text-[13px] rounded-lg ${
                  isSelected
                    ? 'bg-brand-500 text-white font-semibold'
                    : isToday
                      ? 'border border-brand-500 text-brand-600 font-semibold'
                      : inMonth
                        ? 'text-gray-900 hover:bg-gray-100'
                        : 'text-gray-300'
                }`}
              >
                {d.getDate()}
                {has ? (
                  <span
                    className={`absolute bottom-1 w-1 h-1 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-brand-500'
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 mb-3 ml-1">{listTitle}</p>
      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">로딩 중…</p>
      ) : monthMemos.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <span className="text-3xl mb-2">📅</span>
          <p className="text-sm text-gray-400">이 달 일정이 없습니다</p>
        </div>
      ) : (
        monthMemos.map((m) => (
          <MemoCard
            key={m.id}
            memo={m}
            onChanged={refetch}
            highlighted={m.schedule_date === selectedKey}
          />
        ))
      )}
    </AppShell>
  );
}
