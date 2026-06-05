'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MemoCard } from '@/components/MemoCard';
import { getMemos } from '@/lib/api';
import { nextFireTime, type Memo } from '@/lib/types';

export default function AlarmsPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const data = await getMemos();
      setMemos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림을 불러오지 못했습니다');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMemos();
        if (!cancelled) setMemos(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '알림을 불러오지 못했습니다');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 일회성 알람(repeat=none)이 이미 지난 경우 숨김. 반복 알람은 계속 표시.
  // 정렬: 다음 발생 시각 임박순.
  const now = Date.now();
  const alarms = memos
    .filter((m) => {
      if (!m.alarm_date) return false;
      const isRecurring = m.repeat && m.repeat !== 'none';
      if (isRecurring) return true;
      return new Date(m.alarm_date).getTime() >= now;
    })
    .sort((a, b) => nextFireTime(a) - nextFireTime(b));

  return (
    <AppShell title="예정된 알림" subtitle={`${alarms.length}건의 알림`} width="wide">
      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">로딩 중…</p>
      ) : error ? (
        <p className="text-red-600 text-sm py-4">{error}</p>
      ) : alarms.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <span className="text-3xl mb-2">🔕</span>
          <p className="text-sm text-gray-400">예약된 알림이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {alarms.map((m) => (
            <MemoCard key={m.id} memo={m} onChanged={refetch} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
