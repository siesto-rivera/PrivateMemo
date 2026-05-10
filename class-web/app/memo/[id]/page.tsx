'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { AppShell } from '@/components/AppShell';
import { MemoEditModal } from '@/components/MemoCard';
import { getMemo } from '@/lib/api';
import { REPEAT_LABELS, stickyPalette, type Memo } from '@/lib/types';

export default function MemoDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(params?.id);
  const fromPath = searchParams.get('from');
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  function goBack() {
    if (fromPath) {
      const decoded = decodeURIComponent(fromPath);
      if (!decoded.startsWith('/memo')) {
        router.push(decoded);
        return;
      }
    }
    router.back();
  }

  async function reload() {
    try {
      const data = await getMemo(id);
      setMemo(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '메모를 불러오지 못했습니다');
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMemo(id);
        if (!cancelled) setMemo(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '메모를 불러오지 못했습니다');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <AppShell
      title="메모"
      headerLeft={
        <button
          onClick={goBack}
          aria-label="뒤로가기"
          className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
        >
          <span className="text-2xl leading-none -mt-1">‹</span>
        </button>
      }
      headerRight={
        memo ? (
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-full bg-white/20 text-xs text-white font-medium hover:bg-white/30"
          >
            수정
          </button>
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-gray-500 py-12 text-center">로딩 중…</p>
      ) : error ? (
        <p className="text-sm text-red-600 py-12 text-center">{error}</p>
      ) : memo ? (
        <>
          <div className="relative mt-2 mb-8 mx-2">
            <div
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-[72px] h-[18px] rounded-sm shadow-sm z-10"
              style={{
                backgroundColor: stickyPalette(memo.category_name).tape,
                transform: 'translateX(-50%) rotate(-4deg)',
              }}
            />
            <div
              className="rounded-sm px-7 py-9 shadow-lg"
              style={{
                backgroundColor: stickyPalette(memo.category_name).bg,
                borderColor: stickyPalette(memo.category_name).border,
                borderWidth: 1,
                borderStyle: 'solid',
                transform: 'rotate(-0.7deg)',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06)',
              }}
            >
              <div className="text-[16px] text-gray-800 leading-7 prose prose-sm max-w-none [&_a]:text-brand-600 [&_code]:bg-white/40 [&_code]:px-1 [&_code]:rounded [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900">
                <ReactMarkdown>{memo.memo}</ReactMarkdown>
              </div>
            </div>
          </div>

          {memo.schedule_date ? (
            <div className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">일정</p>
              <p className="text-sm text-gray-900">
                📅 {memo.schedule_date.replace(/-/g, '.')}
              </p>
            </div>
          ) : null}

          {memo.alarm_date ? (
            <div className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">알림</p>
              <p className="text-sm text-gray-900">
                🔔 {new Date(memo.alarm_date).toLocaleString('ko-KR')}
                {memo.repeat && memo.repeat !== 'none'
                  ? `  🔁 ${REPEAT_LABELS[memo.repeat]}`
                  : ''}
              </p>
            </div>
          ) : null}

          {memo.tag.length > 0 ? (
            <div className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">태그</p>
              <div className="flex flex-wrap gap-1.5">
                {memo.tag.map((t) => (
                  <span
                    key={t}
                    className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-[12px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {memo.images && memo.images.length > 0 ? (
            <div className="bg-white rounded-2xl px-4 py-4 mb-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">사진</p>
              <p className="text-[12px] text-gray-400">
                📷 {memo.images.length}장 (사진은 작성한 모바일 기기의 사진 앱에서 확인할 수 있습니다)
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-2xl py-4 font-semibold mt-6"
          >
            수정
          </button>
        </>
      ) : null}

      {editing && memo ? (
        <MemoEditModal
          memo={memo}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
          onDeleted={() => {
            setEditing(false);
            goBack();
          }}
        />
      ) : null}
    </AppShell>
  );
}
