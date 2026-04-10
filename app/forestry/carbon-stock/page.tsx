// v2.1 Forestry chart ② — 국가별 탄소 저장량 추이

import { Suspense } from 'react';
import { loadForestCountryScenarios } from '@/lib/iamc/load-csv';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { MultiLineChart } from '@/components/charts/MultiLineChart';
import { RegionSelector } from '@/components/layout/RegionSelector';
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
    <div className="space-y-4">
      <div className="flex items-center"><Suspense fallback={null}><RegionSelector /></Suspense></div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <div className="text-center flex-1">
            <h2 className="text-2xl font-semibold text-slate-800">{t('page.forestry.carbon-stock', lang)}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('page.forestry.carbon-stock.sub', lang, { region: countryCode })}</p>
          </div>
          <div className="text-xs text-slate-400">
            {years.length > 0 && `${years[0]}–${years[years.length - 1]}`}
          </div>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          {carbonStock.length === 0 ? (
            <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
          ) : (
            <MultiLineChart rows={carbonStock} groupKey="scenario" groupColors={SCENARIO_COLORS} groupStyles={SCENARIO_STYLES} groupOrder={SCENARIO_ORDER} yAxisLabel={t('yaxis.carbon-stock', lang)} />
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400">Source: data/forest/IAMC_Reports_* · {countryCode}</p>
    </div>
  );
}
