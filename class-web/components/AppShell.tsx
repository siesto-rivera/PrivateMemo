'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const TABS = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/categories', label: '카테고리', icon: '🗂️' },
  { href: '/add', label: '추가', icon: '➕' },
  { href: '/alarms', label: '알림', icon: '🔔' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

export function AppShell({
  title,
  subtitle,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-100">
      <div className="w-full max-w-md min-h-screen bg-gray-50 flex flex-col shadow-sm relative">
        <header className="bg-white border-b border-gray-100 px-5 pt-5 pb-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle ? (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          {headerRight}
        </header>

        <main className="flex-1 px-5 pt-4 pb-24 overflow-y-auto">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-white border-t border-gray-100 flex h-16">
          {TABS.map((t) => {
            const active =
              t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex-1 flex flex-col items-center justify-center text-[11px] gap-0.5 ${
                  active ? 'text-brand-600 font-semibold' : 'text-gray-400'
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
  );
}
