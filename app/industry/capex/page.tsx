// v2.1 Industry ④ — 전환 투자비용 구조

import { Suspense } from 'react';
import { loadIamcSheet } from '@/lib/iamc/load';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { Percent100StackedWithTrend } from '@/components/charts/Percent100StackedWithTrend';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import type { IamcRow } from '@/lib/iamc/types';

const COST_KEYS: Record<string, string> = {
  'Investment|Steel|CAPEX': 'cost.capex',
  'Investment|Steel|OPEX': 'cost.opex',
};
const COST_ORDER_KEYS = ['cost.opex', 'cost.capex'];
const COST_COLOR_MAP: Record<string, string> = {
  'cost.capex': '#6366f1', 'cost.opex': '#f97316',
};

export default async function CapexPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; lang?: string }>;
}) {
  const { region, lang: langParam } = await searchParams;
  const countryCode = region || 'KOR';
  const lang = (langParam as Lang) || DEFAULT_LANG;

  const feedback = await loadIamcSheet('data/industry/SNU_Ind_Submission.xlsx', 'Table_Ind_Feedback');
  const investmentRows = filterByVariablePattern(feedback.rows, 'Investment|Steel|*')
    .filter((r) => r.region === countryCode);

  if (investmentRows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 text-center">{t('page.industry.capex', lang)}</h2>
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      </div>
    );
  }

  const costLabels: Record<string, string> = {};
  for (const [v, key] of Object.entries(COST_KEYS)) costLabels[v] = t(key, lang);
  const stackOrder = COST_ORDER_KEYS.map((k) => t(k, lang));
  const stackColors: Record<string, string> = {};
  for (const [k, c] of Object.entries(COST_COLOR_MAP)) stackColors[t(k, lang)] = c;

  const displayRows: IamcRow[] = investmentRows.map((r) => ({
    ...r, variable: costLabels[r.variable] ?? r.variable,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center"><Suspense fallback={null}><RegionSelector /></Suspense></div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 text-center">{t('page.industry.capex', lang)}</h2>
        <p className="mt-1 text-sm text-slate-500 text-center">{t('page.industry.capex.sub', lang, { region: countryCode })}</p>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <Percent100StackedWithTrend rows={displayRows} stackKey="variable" stackOrder={stackOrder} stackColors={stackColors} trendLines={false} mode="absolute" yAxisLabel="Investment (Million USD)" />
        </div>
      </div>
      <p className="text-xs text-slate-400">Source: data/industry/SNU_Ind_Submission.xlsx · Table_Ind_Feedback</p>
    </div>
  );
}
