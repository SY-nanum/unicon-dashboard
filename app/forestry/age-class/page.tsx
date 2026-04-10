// v2.1 Forestry ③ — 영급 구조 변화

import { loadForestCountryScenarios } from '@/lib/iamc/load-csv';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { ProcessMixChart } from '@/components/charts/ProcessMixChart';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import type { IamcRow } from '@/lib/iamc/types';

const AGE_KEYS = ['age.young', 'age.middle', 'age.mature', 'age.old'] as const;
const AGE_VARIABLE_MAP: Record<string, typeof AGE_KEYS[number]> = {
  'Area|Forest|Age Class|0-20': 'age.young',
  'Area|Forest|Age Class|21-40': 'age.middle',
  'Area|Forest|Age Class|41-60': 'age.mature',
  'Area|Forest|Age Class|61+': 'age.old',
};

function ageColors(lang: Lang): Record<string, string> {
  return {
    [t('age.young', lang)]: '#bbf7d0',
    [t('age.middle', lang)]: '#4ade80',
    [t('age.mature', lang)]: '#16a34a',
    [t('age.old', lang)]: '#14532d',
  };
}

const PROJECTION_CUTOFF = 2025;
const PROJECTION_SCENARIOS = ['BAU', 'NetZero'];

export default async function ForestryAgeClassPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; lang?: string }>;
}) {
  const { region, lang: langParam } = await searchParams;
  const countryCode = region || 'KOR';
  const lang = (langParam as Lang) || DEFAULT_LANG;
  const allRows = await loadForestCountryScenarios(countryCode);
  const ageRows = filterByVariablePattern(allRows, 'Area|Forest|Age Class|*');

  const displayRows: IamcRow[] = ageRows.map((r) => {
    const key = AGE_VARIABLE_MAP[r.variable];
    return { ...r, variable: key ? t(key, lang) : r.variable };
  });

  const stackOrder = AGE_KEYS.map((k) => t(k, lang));
  const colors = ageColors(lang);

  const netZeroHasData = displayRows.some((r) => r.scenario === 'NetZero' && r.year >= PROJECTION_CUTOFF);
  const historicalYears = [...new Set(displayRows.filter((r) => r.scenario === 'Historical').map((r) => r.year))].sort((a, b) => a - b);

  const legend = (
    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
      <span><span className="inline-block h-2 w-2 rounded-full bg-slate-400 align-middle mr-1" />{t('footer.historical', lang)}: {historicalYears.length > 0 ? `${historicalYears[0]}–${historicalYears[historicalYears.length - 1]}` : '—'}</span>
      <span><span className="inline-block h-2 w-2 rounded-full bg-green-500 align-middle mr-1" />{t('footer.projection', lang)}: {PROJECTION_CUTOFF}–2050</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ProcessMixChart
          title={t('page.forestry.age-class', lang)}
          subtitle={t('page.forestry.age-class.sub', lang, { region: countryCode })}
          rows={displayRows}
          projectionScenarios={PROJECTION_SCENARIOS}
          defaultScenario={netZeroHasData ? 'NetZero' : 'BAU'}
          projectionCutoff={PROJECTION_CUTOFF}
          stackOrder={stackOrder}
          stackColors={colors}
          footer={legend}
        />
      </div>
      <p className="text-xs text-slate-400">Source: data/forest/IAMC_Reports_* · {countryCode}</p>
    </div>
  );
}
