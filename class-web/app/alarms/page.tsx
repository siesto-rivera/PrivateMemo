import { AppShell } from '@/components/AppShell';
import { MemoCard } from '@/components/MemoCard';
import { MOCK_MEMOS } from '@/lib/mock-data';

export default function AlarmsPage() {
  const alarms = MOCK_MEMOS.filter((m) => !!m.alarm_date).sort((a, b) =>
    (a.alarm_date ?? '').localeCompare(b.alarm_date ?? ''),
  );

  return (
    <AppShell title="예정된 알림" subtitle={`${alarms.length}건의 알림`}>
      {alarms.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <span className="text-3xl mb-2">🔕</span>
          <p className="text-sm text-gray-400">예약된 알림이 없습니다</p>
        </div>
      ) : (
        alarms.map((m) => <MemoCard key={m.id} memo={m} />)
      )}
    </AppShell>
  );
}
