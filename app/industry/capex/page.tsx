// v2.1 Industry ④ — 전환 투자비용 구조

import { Suspense } from 'react';
import { loadIamcSheet } from '@/lib/iamc/load';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { Percent100StackedWithTrend } from '@/components/charts/Percent100StackedWithTrend';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { UniconCard } from '@/components/ui/UniconCard';
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
      <UniconCard title={t('page.industry.capex', lang)}>
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      </UniconCard>
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
    <UniconCard
      title={t('page.industry.capex', lang)}
      subtitle={t('page.industry.capex.sub', lang, { region: countryCode })}
      source="data/industry/SNU_Ind_Submission.xlsx · Table_Ind_Feedback"
      headerActions={<Suspense fallback={null}><RegionSelector /></Suspense>}
    >
      <Percent100StackedWithTrend rows={displayRows} stackKey="variable" stackOrder={stackOrder} stackColors={stackColors} trendLines={false} mode="absolute" yAxisLabel="Investment (Million USD)" />
    </UniconCard>
  );
}
