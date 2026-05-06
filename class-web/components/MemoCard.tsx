import { Memo, formatDate, CATEGORY_EMOJI } from '@/lib/mock-data';

export function MemoCard({ memo }: { memo: Memo }) {
  const emoji = CATEGORY_EMOJI[memo.category_name] ?? '📝';
  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 mb-3 border border-gray-100 hover:bg-gray-50 cursor-pointer transition">
      <div className="flex items-center mb-1.5">
        <span className="text-lg mr-2">{emoji}</span>
        <span className="text-xs font-semibold text-brand-600">
          {memo.category_name}
        </span>
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
    </div>
  );
}
