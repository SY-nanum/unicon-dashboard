// v2.1 Industry ① — 철강 탄소 감축 기여도

import { Suspense } from 'react';
import { loadIamcSheet } from '@/lib/iamc/load';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { ReductionWaterfallChart } from '@/components/charts/ReductionWaterfallChart';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { UniconCard } from '@/components/ui/UniconCard';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

export default async function ReductionContributionPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; lang?: string }>;
}) {
  const { region, lang: langParam } = await searchParams;
  const countryCode = region || 'KOR';
  const lang = (langParam as Lang) || DEFAULT_LANG;

  const techMix = await loadIamcSheet('data/industry/SNU_Ind_Submission.xlsx', 'Table_Ind_Tech_Mix');
  const allRows = techMix.rows.filter((r) => r.region === countryCode);
  const bauEmissions = allRows.filter((r) => r.scenario === 'BAU' && r.variable === 'Emissions|CO2|Steel|Total');
  const nzEmissions = allRows.filter((r) => r.scenario === 'NetZero' && r.variable === 'Emissions|CO2|Steel|Total');
  const reductions = filterByVariablePattern(allRows, 'Emissions Reduction|Steel|*');

  if (reductions.length === 0) {
    return (
      <UniconCard title={t('page.industry.reduction', lang)}>
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      </UniconCard>
    );
  }

  return (
    <UniconCard
      title={t('page.industry.reduction', lang)}
      subtitle={t('page.industry.reduction.sub', lang, { region: countryCode })}
      source="data/industry/SNU_Ind_Submission.xlsx · Table_Ind_Tech_Mix"
      headerActions={<Suspense fallback={null}><RegionSelector /></Suspense>}
    >
      <ReductionWaterfallChart bauEmissions={bauEmissions} nzEmissions={nzEmissions} reductions={reductions} />
    </UniconCard>
  );
}
