// v2.1 Industry ③ — 에너지 집약도 및 소비 구조

import { Suspense } from 'react';
import { loadIamcSheet } from '@/lib/iamc/load';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { MultiLineChart } from '@/components/charts/MultiLineChart';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { UniconCard } from '@/components/ui/UniconCard';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import type { IamcRow } from '@/lib/iamc/types';

const FUEL_KEYS: Record<string, string> = {
  'Energy Intensity|Steel|Coal': 'fuel.coal',
  'Energy Intensity|Steel|Electricity': 'fuel.electricity',
  'Energy Intensity|Steel|Hydrogen': 'fuel.hydrogen',
};
const FUEL_ORDER_KEYS = ['fuel.coal', 'fuel.electricity', 'fuel.hydrogen'];
const FUEL_COLOR_MAP: Record<string, string> = {
  'fuel.coal': '#475569', 'fuel.electricity': '#3b82f6', 'fuel.hydrogen': '#22c55e',
};
const PROJECTION_CUTOFF = 2025;

export default async function EnergyIntensityPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; lang?: string }>;
}) {
  const { region, lang: langParam } = await searchParams;
  const countryCode = region || 'KOR';
  const lang = (langParam as Lang) || DEFAULT_LANG;

  const feedback = await loadIamcSheet('data/industry/SNU_Ind_Submission.xlsx', 'Table_Ind_Feedback');
  const intensityRows = filterByVariablePattern(feedback.rows, 'Energy Intensity|Steel|*')
    .filter((r) => r.region === countryCode);

  if (intensityRows.length === 0) {
    return (
      <UniconCard title={t('page.industry.energy-intensity', lang)}>
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      </UniconCard>
    );
  }

  const historical = intensityRows.filter((r) => r.scenario === 'Historical' && r.year < PROJECTION_CUTOFF);
  const projection = intensityRows.filter((r) => r.scenario === 'NetZero' && r.year >= PROJECTION_CUTOFF);
  const merged: IamcRow[] = [...historical, ...projection];
  const lastHistYear = historical.length > 0 ? Math.max(...historical.map((r) => r.year)) : 0;
  const fuelLabels: Record<string, string> = {};
  for (const [v, key] of Object.entries(FUEL_KEYS)) fuelLabels[v] = t(key, lang);
  const fuelOrder = FUEL_ORDER_KEYS.map((k) => t(k, lang));
  const fuelColors: Record<string, string> = {};
  for (const [k, c] of Object.entries(FUEL_COLOR_MAP)) fuelColors[t(k, lang)] = c;

  for (const variable of Object.keys(FUEL_KEYS)) {
    const anchor = historical.find((r) => r.variable === variable && r.year === lastHistYear);
    if (anchor) merged.push({ ...anchor });
  }
  const displayRows = merged.map((r) => ({ ...r, variable: fuelLabels[r.variable] ?? r.variable }));

  return (
    <UniconCard
      title={t('page.industry.energy-intensity', lang)}
      subtitle={t('page.industry.energy-intensity.sub', lang, { region: countryCode })}
      source="data/industry/SNU_Ind_Submission.xlsx · Table_Ind_Feedback"
      headerActions={<Suspense fallback={null}><RegionSelector /></Suspense>}
    >
      <MultiLineChart rows={displayRows} groupKey="variable" groupColors={fuelColors} groupOrder={fuelOrder} yAxisLabel="Energy Intensity (toe/ton)" />
    </UniconCard>
  );
}
