// v2.1 Forestry chart ② — 국가별 탄소 저장량 추이

import { Suspense } from 'react';
import { loadForestCountryScenarios } from '@/lib/iamc/load-csv';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { MultiLineChart } from '@/components/charts/MultiLineChart';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { UniconCard } from '@/components/ui/UniconCard';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

const SCENARIO_COLORS: Record<string, string> = { Historical: '#64748b', BAU: '#dc2626', NetZero: '#059669' };
const SCENARIO_STYLES: Record<string, { lineType?: 'solid' | 'dashed' }> = { Historical: { lineType: 'solid' }, BAU: { lineType: 'dashed' }, NetZero: { lineType: 'solid' } };
const SCENARIO_ORDER = ['Historical', 'BAU', 'NetZero'];

export default async function ForestryCarbonStockPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; lang?: string }>;
}) {
  const { region, lang: langParam } = await searchParams;
  const countryCode = region || 'KOR';
  const lang = (langParam as Lang) || DEFAULT_LANG;
  const allRows = await loadForestCountryScenarios(countryCode);
  const rawRows = filterByVariablePattern(allRows, 'Carbon Stock|Forest|Total');

  const HISTORICAL_END = 2024;
  const PROJECTION_START = 2025;
  const historical2024 = rawRows.find((r) => r.scenario === 'Historical' && r.year === HISTORICAL_END);
  const carbonStock = rawRows.filter((r) => r.scenario === 'Historical' || r.year >= PROJECTION_START);
  if (historical2024) {
    carbonStock.push({ ...historical2024, scenario: 'BAU', year: HISTORICAL_END });
    carbonStock.push({ ...historical2024, scenario: 'NetZero', year: HISTORICAL_END });
  }

  const years = [...new Set(carbonStock.map((r) => r.year))].sort((a, b) => a - b);

  return (
    <UniconCard
      title={t('page.forestry.carbon-stock', lang)}
      subtitle={t('page.forestry.carbon-stock.sub', lang, { region: countryCode })}
      source={`data/forest/IAMC_Reports_* · ${countryCode}`}
      headerActions={<Suspense fallback={null}><RegionSelector /></Suspense>}
    >
      {carbonStock.length === 0 ? (
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      ) : (
        <MultiLineChart rows={carbonStock} groupKey="scenario" groupColors={SCENARIO_COLORS} groupStyles={SCENARIO_STYLES} groupOrder={SCENARIO_ORDER} yAxisLabel={t('yaxis.carbon-stock', lang)} />
      )}
    </UniconCard>
  );
}
