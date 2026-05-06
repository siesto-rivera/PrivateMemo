'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">로그인</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500">이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 outline-none border border-gray-200 focus:border-brand-500"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="bg-gray-50 rounded-xl px-4 py-3 text-[15px] text-gray-900 outline-none border border-gray-200 focus:border-brand-500"
          />
        </label>
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 rounded-2xl py-3 text-white text-base font-semibold"
        >
          {submitting ? '로그인 중…' : '로그인'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-5">
        <Link href="/signup" className="text-brand-600 font-medium hover:underline">
          회원가입하기
        </Link>
      </p>
    </div>
  );
}
