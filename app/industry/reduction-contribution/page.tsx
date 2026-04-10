// v2.1 Industry ① — 철강 탄소 감축 기여도

import { Suspense } from 'react';
import { loadIamcSheet } from '@/lib/iamc/load';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import { ReductionWaterfallChart } from '@/components/charts/ReductionWaterfallChart';
import { RegionSelector } from '@/components/layout/RegionSelector';
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
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 text-center">{t('page.industry.reduction', lang)}</h2>
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center"><Suspense fallback={null}><RegionSelector /></Suspense></div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 text-center">{t('page.industry.reduction', lang)}</h2>
        <p className="mt-1 text-sm text-slate-500 text-center">{t('page.industry.reduction.sub', lang, { region: countryCode })}</p>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <ReductionWaterfallChart bauEmissions={bauEmissions} nzEmissions={nzEmissions} reductions={reductions} />
        </div>
      </div>
      <p className="text-xs text-slate-400">Source: data/industry/SNU_Ind_Submission.xlsx · Table_Ind_Tech_Mix</p>
    </div>
  );
}
