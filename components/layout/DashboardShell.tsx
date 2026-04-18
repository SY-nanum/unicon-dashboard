'use client';

// Dashboard shell: left sector sidebar + top chart tabs + content area.

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { SECTORS, SECTOR_COLOR_CLASSES, findSector } from '@/lib/sectors';
import { sectorName, chartTitle, t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { LanguageSelector } from './LanguageSelector';

interface Props {
  children: React.ReactNode;
}

function ShellInner({ children }: Props) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') as Lang) || DEFAULT_LANG;
  const [, sectorSlug, chartSlug] = pathname.split('/');
  const activeSector = sectorSlug ? findSector(sectorSlug) : undefined;

  /** Preserve query params (lang, region) when navigating */
  function hrefWithParams(path: string): string {
    const params = new URLSearchParams(searchParams.toString());
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <aside className="w-32 shrink-0 border-r border-slate-200 bg-white">
        {/* Language selector in spacer area */}
        <div className="flex h-[5rem] items-center justify-center border-b border-slate-100">
          <Suspense fallback={null}>
            <LanguageSelector />
          </Suspense>
        </div>
        <nav className="flex flex-col gap-1 px-1.5 pt-1.5">
          <div className="px-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            부문
          </div>
          {SECTORS.map((s) => {
            const active = s.slug === sectorSlug;
            const c = SECTOR_COLOR_CLASSES[s.color];
            const firstChart = s.charts[0];
            const href = hrefWithParams(`/${s.slug}/${firstChart.slug}`);
            return (
              <Link
                key={s.slug}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={
                  'block rounded border-2 px-2 py-1.5 text-center text-sm font-semibold transition ' +
                  (active
                    ? `${c.tileActiveBg} border-transparent text-white shadow`
                    : `bg-white ${c.tileInactiveBorder} ${c.tileInactiveHoverBg} text-slate-900`)
                }
              >
                {sectorName(s.slug, lang)}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Chart tabs (only when a sector is active) */}
        {activeSector && (
          <div className="bg-white px-4 py-2 border-b border-slate-200">
            <div className="grid grid-flow-col auto-cols-fr gap-1">
              {activeSector.charts.map((chart, idx) => {
                const isActiveChart = chart.slug === chartSlug;
                const title = chartTitle(chart.slug, lang);
                const lines = title.split('\n');
                return (
                  <Link
                    key={chart.slug}
                    href={hrefWithParams(`/${activeSector.slug}/${chart.slug}`)}
                    aria-current={isActiveChart ? 'page' : undefined}
                    className={
                      'group flex items-start gap-2 rounded-md border-2 px-3 py-2 transition ' +
                      (isActiveChart
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-indigo-500 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }
                  >
                    <span
                      className={
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ' +
                        (isActiveChart
                          ? 'bg-white text-indigo-600'
                          : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300')
                      }
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-left">
                      <span className="block text-sm font-semibold leading-tight">
                        {lines[0]}
                      </span>
                      <span className="block text-sm font-semibold leading-tight">
                        {lines[1] ?? ''}
                        {!chart.implemented && (
                          <span className={
                            'ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] align-middle ' +
                            (isActiveChart ? 'bg-indigo-300/50 text-white' : 'bg-slate-100 text-slate-400')
                          }>
                            {t('ui.preparing', lang)}
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 bg-slate-50 px-3 py-4">{children}</main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: Props) {
  return (
    <Suspense fallback={null}>
      <ShellInner>{children}</ShellInner>
    </Suspense>
  );
}
