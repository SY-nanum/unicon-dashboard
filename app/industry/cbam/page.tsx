// v2.1 Industry ⑤ — CBAM 경쟁력 진단

import { Suspense } from 'react';
import { loadIamcSheet } from '@/lib/iamc/load';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { MultiLineChart } from '@/components/charts/MultiLineChart';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import type { IamcRow } from '@/lib/iamc/types';

const SCENARIO_COLORS: Record<string, string> = { Historical: '#64748b', NetZero: '#059669' };
const SCENARIO_STYLES: Record<string, { lineType?: 'solid' | 'dashed' }> = { Historical: { lineType: 'solid' }, NetZero: { lineType: 'solid' } };
const PROJECTION_CUTOFF = 2025;

export default async function CbamPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; lang?: string }>;
}) {
  const { region, lang: langParam } = await searchParams;
  const countryCode = region || 'KOR';
  const lang = (langParam as Lang) || DEFAULT_LANG;

  const feedback = await loadIamcSheet('data/industry/SNU_Ind_Submission.xlsx', 'Table_Ind_Feedback');
  const carbonIntensity = filterByVariablePattern(feedback.rows, 'Carbon Intensity|Steel|Average')
    .filter((r) => r.region === countryCode);

  if (carbonIntensity.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 text-center">{t('page.industry.cbam', lang)}</h2>
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      </div>
    );
  }

  const historical = carbonIntensity.filter((r) => r.scenario === 'Historical');
  const netZero = carbonIntensity.filter((r) => r.scenario === 'NetZero' && r.year >= PROJECTION_CUTOFF);
  const merged: IamcRow[] = [...historical, ...netZero];
  const lastHistYear = historical.length > 0 ? Math.max(...historical.map((r) => r.year)) : 0;
  const anchor = historical.find((r) => r.year === lastHistYear);
  if (anchor) merged.push({ ...anchor, scenario: 'NetZero', year: lastHistYear });

  return (
    <div className="space-y-4">
      <div className="flex items-center"><Suspense fallback={null}><RegionSelector /></Suspense></div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 text-center">{t('page.industry.cbam', lang)}</h2>
        <p className="mt-1 text-sm text-slate-500 text-center">{t('page.industry.cbam.sub', lang, { region: countryCode })}</p>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <MultiLineChart rows={merged} groupKey="scenario" groupColors={SCENARIO_COLORS} groupStyles={SCENARIO_STYLES} groupOrder={['Historical', 'NetZero']} yAxisLabel="Carbon Intensity (tCO₂/ton)" />
        </div>
      </div>
      <p className="text-xs text-slate-400">Source: data/industry/SNU_Ind_Submission.xlsx · Table_Ind_Feedback</p>
    </div>
  );
}
