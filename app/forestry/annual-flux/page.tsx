// v2.1 Forestry ⑤ — 연간 순흡수량

import { Suspense } from 'react';
import { loadForestCountryScenarios } from '@/lib/iamc/load-csv';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { MultiLineChart } from '@/components/charts/MultiLineChart';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { UniconCard } from '@/components/ui/UniconCard';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import type { IamcRow } from '@/lib/iamc/types';

const SCENARIO_COLORS: Record<string, string> = { Historical: '#64748b', BAU: '#dc2626', NetZero: '#059669' };
const SCENARIO_STYLES: Record<string, { lineType?: 'solid' | 'dashed' }> = { Historical: { lineType: 'solid' }, BAU: { lineType: 'dashed' }, NetZero: { lineType: 'solid' } };
const SCENARIO_ORDER = ['Historical', 'BAU', 'NetZero'];
const PROJECTION_CUTOFF = 2025;

export default async function ForestryAnnualFluxPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; lang?: string }>;
}) {
  const { region, lang: langParam } = await searchParams;
  const countryCode = region || 'KOR';
  const lang = (langParam as Lang) || DEFAULT_LANG;
  const allRows = await loadForestCountryScenarios(countryCode);
  const fluxRows = filterByVariablePattern(allRows, 'Emissions|CO2|Land Use|Forestry');

  const historical = fluxRows.filter((r) => r.scenario === 'Historical');
  const bau = fluxRows.filter((r) => r.scenario === 'BAU' && r.year >= PROJECTION_CUTOFF);
  const netZero = fluxRows.filter((r) => r.scenario === 'NetZero' && r.year >= PROJECTION_CUTOFF);
  const merged: IamcRow[] = [...historical, ...bau, ...netZero];

  if (historical.length > 0) {
    const lastYear = Math.max(...historical.map((r) => r.year));
    const anchor = historical.find((r) => r.year === lastYear);
    if (anchor) {
      merged.push({ ...anchor, scenario: 'BAU', year: lastYear });
      merged.push({ ...anchor, scenario: 'NetZero', year: lastYear });
    }
  }

  return (
    <UniconCard
      title={t('page.forestry.annual-flux', lang)}
      subtitle={t('page.forestry.annual-flux.sub', lang, { region: countryCode })}
      source={`data/forest/IAMC_Reports_* · ${countryCode}`}
      headerActions={<Suspense fallback={null}><RegionSelector /></Suspense>}
    >
      {merged.length === 0 ? (
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      ) : (
        <MultiLineChart rows={merged} groupKey="scenario" groupColors={SCENARIO_COLORS} groupStyles={SCENARIO_STYLES} groupOrder={SCENARIO_ORDER} yAxisLabel={t('yaxis.net-flux', lang)} />
      )}
    </UniconCard>
  );
}
