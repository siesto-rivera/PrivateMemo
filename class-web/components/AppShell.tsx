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

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function AppShell({
  title,
  subtitle,
  headerLeft,
  headerRight,
  width = 'narrow',
  children,
}: {
  title: string;
  subtitle?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  /** 'wide' for card-grid list pages, 'narrow' (default) for forms/settings. */
  width?: 'wide' | 'narrow';
  children: ReactNode;
}) {
  const pathname = usePathname();
  const containerWidth = width === 'wide' ? 'max-w-6xl' : 'max-w-2xl';

  return (
    <AuthGuard>
      <div className="min-h-screen w-full bg-gray-100">
        {/* Desktop top nav */}
        <header className="hidden md:block bg-brand-500 sticky top-0 z-20 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-2">
            <Link href="/" className="text-white font-bold text-base mr-4 shrink-0">
              📝 사적인 메모장
            </Link>
            <nav className="flex items-center gap-1">
              {TABS.map((t) => {
                const active = isActive(pathname, t.href);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`px-3 py-1.5 rounded-full text-sm transition flex items-center gap-1.5 ${
                      active
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-base leading-none">{t.icon}</span>
                    <span>{t.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto">{headerRight}</div>
          </div>
        </header>

        {/* Mobile header */}
        <header className="md:hidden bg-brand-500 px-3 pt-5 pb-4 sticky top-0 z-10 relative">
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

        <main
          className={`${containerWidth} w-full mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-24 md:pb-12`}
        >
          {/* Desktop page heading */}
          <div className="hidden md:flex items-center gap-3 mb-5">
            {headerLeft}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{title}</h1>
              {subtitle ? (
                <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
              ) : null}
            </div>
          </div>

          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-brand-500 flex h-16">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
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
    </AuthGuard>
  );
}
