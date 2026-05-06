'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { MemoCard } from '@/components/MemoCard';
import { getMemos } from '@/lib/api';
import type { Memo } from '@/lib/types';

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

  const alarms = memos
    .filter((m) => !!m.alarm_date)
    .sort((a, b) => (a.alarm_date ?? '').localeCompare(b.alarm_date ?? ''));

  return (
    <AppShell title="예정된 알림" subtitle={`${alarms.length}건의 알림`}>
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
        alarms.map((m) => <MemoCard key={m.id} memo={m} onChanged={refetch} />)
      )}
    </AppShell>
  );
}
