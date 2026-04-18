// Dynamic fallback page for sectors/charts that haven't been implemented yet.
// Static routes (e.g. app/industry/process-mix/page.tsx) take precedence.

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { findSector, SECTOR_COLOR_CLASSES } from '@/lib/sectors';
import { sectorName, chartTitle, t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { UniconCard } from '@/components/ui/UniconCard';

interface Params {
  sector: string;
  chart: string;
}

export default async function DynamicChartPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { sector: sectorSlug, chart: chartSlug } = await params;
  const { lang: langParam } = await searchParams;
  const lang = (langParam as Lang) || DEFAULT_LANG;
  const sector = findSector(sectorSlug);
  const chart = sector?.charts.find((c) => c.slug === chartSlug);
  if (!sector || !chart) notFound();

  const colors = SECTOR_COLOR_CLASSES[sector.color];

  return (
    <UniconCard
      title={chartTitle(chartSlug, lang).replace('\n', ' ')}
      headerActions={<Suspense fallback={null}><RegionSelector /></Suspense>}
    >
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <span className={`inline-block h-2 w-2 rounded-full ${colors.dot}`} />
        <span className={colors.accent}>{sectorName(sector.slug, lang)}</span>
      </div>
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <svg
          className="mb-4 h-12 w-12 text-slate-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
        <p className="text-sm font-medium text-slate-600">{t('ui.placeholder', lang)}</p>
      </div>
    </UniconCard>
  );
}
