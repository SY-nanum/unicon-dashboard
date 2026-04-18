// Design Ref: page 19 "공정기술 점유율 변화"

import { UniconCard } from '@/components/ui/UniconCard';
import { loadIamcSheet } from '@/lib/iamc/load';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { ProcessMixChart } from '@/components/charts/ProcessMixChart';
import { t } from '@/lib/i18n';
import { parseLangRegion, buildLocalizedMaps } from '@/lib/page-helpers';
import type { IamcRow } from '@/lib/iamc/types';

const TECH_KEYS: Record<string, string> = {
  'Capacity|Steel|BF-BOF': 'tech.bf-bof',
  'Capacity|Steel|EAF': 'tech.eaf',
  'Capacity|Steel|DRI-H2': 'tech.dri-h2',
};
const TECH_ORDER_KEYS = ['tech.bf-bof', 'tech.eaf', 'tech.dri-h2'];
const TECH_COLOR_MAP: Record<string, string> = {
  'tech.bf-bof': '#1e3a5f', 'tech.eaf': '#4a90d9', 'tech.dri-h2': '#38a169',
};
const PROJECTION_CUTOFF = 2025;
const PROJECTION_SCENARIOS = ['BAU', 'NetZero'];

export default async function IndustryProcessMixPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; lang?: string }>;
}) {
  const { lang, countryCode } = parseLangRegion(await searchParams);

  const sheet = await loadIamcSheet('data/industry/SNU_Ind_Submission.xlsx', 'Table_Ind_Tech_Mix');
  const capacityRows = filterByVariablePattern(sheet.rows, 'Capacity|Steel|*')
    .filter((r) => r.region === countryCode);

  if (capacityRows.length === 0) {
    return (
      <UniconCard title={t('page.industry.process-mix', lang)}>
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      </UniconCard>
    );
  }

  const { labels: techLabels, order: stackOrder, colors: stackColors } =
    buildLocalizedMaps(TECH_KEYS, TECH_ORDER_KEYS, TECH_COLOR_MAP, lang, t);

  const displayRows: IamcRow[] = capacityRows.map((r) => ({
    ...r, variable: techLabels[r.variable] ?? r.variable,
  }));
  const netZeroHasData = displayRows.some((r) => r.scenario === 'NetZero' && r.year >= PROJECTION_CUTOFF);
  const historicalYears = [...new Set(displayRows.filter((r) => r.scenario === 'Historical').map((r) => r.year))].sort((a, b) => a - b);

  const legend = (
    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
      <span><span className="inline-block h-2 w-2 rounded-full bg-slate-400 align-middle mr-1" />{t('footer.historical', lang)}: {rangeLabel(historicalYears)}</span>
      <span><span className="inline-block h-2 w-2 rounded-full bg-green-500 align-middle mr-1" />{t('footer.projection', lang)}: {PROJECTION_CUTOFF}–2050</span>
    </div>
  );

  return (
    <UniconCard
      title={t('page.industry.process-mix', lang)}
      subtitle={t('page.industry.process-mix.sub', lang, { region: countryCode })}
      source="data/industry/SNU_Ind_Submission.xlsx · Table_Ind_Tech_Mix"
    >
      <ProcessMixChart
        rows={displayRows}
        projectionScenarios={PROJECTION_SCENARIOS}
        defaultScenario={netZeroHasData ? 'NetZero' : 'BAU'}
        projectionCutoff={PROJECTION_CUTOFF}
        stackOrder={stackOrder}
        stackColors={stackColors}
        footer={legend}
      />
    </UniconCard>
  );
}

function rangeLabel(years: number[]): string {
  if (years.length === 0) return '—';
  if (years.length === 1) return String(years[0]);
  return `${years[0]}–${years[years.length - 1]}`;
}
