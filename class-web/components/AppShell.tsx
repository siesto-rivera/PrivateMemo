'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';

const TABS = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/categories', label: '카테고리', icon: '🗂️' },
  { href: '/calendar', label: '일정', icon: '📅' },
  { href: '/alarms', label: '알림', icon: '🔔' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

export function AppShell({
  title,
  subtitle,
  headerLeft,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="min-h-screen w-full flex justify-center bg-gray-100">
        <div className="w-full max-w-md min-h-screen bg-gray-50 flex flex-col shadow-sm relative">
          <header className="bg-brand-500 px-3 pt-5 pb-4 sticky top-0 z-10 relative">
            <div className="flex items-center min-h-[40px]">
              <div>{headerLeft}</div>
              <div
                className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ top: 20, bottom: 16 }}
              >
                <h1 className="text-xl font-bold text-white truncate max-w-[60%] text-center">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="text-xs text-white/70 mt-0.5 truncate max-w-[60%] text-center">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <div className="ml-auto">{headerRight}</div>
            </div>
          </header>

          <main className="flex-1 px-5 pt-4 pb-24 overflow-y-auto">{children}</main>

          <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-brand-500 flex h-16">
            {TABS.map((t) => {
              const active =
                t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`flex-1 flex flex-col items-center justify-center text-[11px] gap-0.5 transition ${
                    active ? 'text-white font-semibold' : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  <span className="text-lg leading-none">{t.icon}</span>
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </AuthGuard>
  );
}
