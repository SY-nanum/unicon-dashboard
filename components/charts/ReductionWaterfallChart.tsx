'use client';

// v2.1 Industry ① — 철강 탄소 감축 기여도 (Waterfall decomposition)
// Shows BAU emissions total → reduction contributions → NetZero result per year.

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import type { EChartsOption } from 'echarts';
import type { IamcRow } from '@/lib/iamc/types';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props {
  /** BAU emissions rows (Emissions|CO2|Steel|Total, scenario=BAU) */
  bauEmissions: IamcRow[];
  /** NetZero emissions rows */
  nzEmissions: IamcRow[];
  /** Reduction contribution rows (Emissions Reduction|Steel|*) */
  reductions: IamcRow[];
  /** Display labels for reduction categories */
  reductionLabels?: Record<string, string>;
  reductionColors?: Record<string, string>;
  height?: number;
}

function defaultLabels(lang: Lang): Record<string, string> {
  return {
    'Emissions Reduction|Steel|Efficiency': t('waterfall.efficiency', lang),
    'Emissions Reduction|Steel|Fuel Switch': t('waterfall.fuel-switch', lang),
    'Emissions Reduction|Steel|CCUS': t('waterfall.ccus', lang),
    'Emissions Reduction|Steel|Hydrogen': t('waterfall.hydrogen', lang),
  };
}

function defaultColors(lang: Lang): Record<string, string> {
  return {
    [t('waterfall.efficiency', lang)]: '#60a5fa',
    [t('waterfall.fuel-switch', lang)]: '#f59e0b',
    [t('waterfall.ccus', lang)]: '#8b5cf6',
    [t('waterfall.hydrogen', lang)]: '#34d399',
  };
}

export function ReductionWaterfallChart({
  bauEmissions,
  nzEmissions,
  reductions,
  reductionLabels,
  reductionColors,
  height = 480,
}: Props) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') as Lang) || DEFAULT_LANG;
  const labels = reductionLabels ?? defaultLabels(lang);
  const colors = reductionColors ?? defaultColors(lang);
  const option = buildOption(bauEmissions, nzEmissions, reductions, labels, colors, lang);
  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height, width: '100%' }} notMerge={true} />
    </div>
  );
}

function buildOption(
  bauEmissions: IamcRow[],
  nzEmissions: IamcRow[],
  reductions: IamcRow[],
  labels: Record<string, string>,
  colors: Record<string, string>,
  lang: Lang,
): EChartsOption {
  const years = Array.from(new Set(reductions.map((r) => r.year))).sort((a, b) => a - b);
  const categories = Array.from(new Set(reductions.map((r) => r.variable)));
  const displayCategories = categories.map((c) => labels[c] ?? c);

  // BAU & NetZero reference lines
  const bauLine = years.map((y) => bauEmissions.find((r) => r.year === y)?.value ?? null);
  const nzLine = years.map((y) => nzEmissions.find((r) => r.year === y)?.value ?? null);

  // Reduction stacks (positive values = reduction amount)
  const stackSeries = categories.map((cat, i) => {
    const label = labels[cat] ?? cat;
    return {
      name: label,
      type: 'bar' as const,
      stack: 'reduction',
      barMaxWidth: 40,
      data: years.map((y) => reductions.find((r) => r.year === y && r.variable === cat)?.value ?? 0),
      itemStyle: { color: colors[label] },
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return '';
        const year = params[0].axisValue;
        const yi = years.indexOf(Number(year));
        const bau = bauLine[yi];
        const nz = nzLine[yi];
        const bars = params.filter((p: any) => p.seriesType === 'bar' && p.value > 0);
        const totalReduction = bars.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
        const lines = [
          `<b>${year}</b>`,
          bau !== null ? `${t('waterfall.bau-emission', lang)}: <b>${bau.toFixed(1)} Mt CO₂</b>` : '',
          ...bars.map((p: any) => `${p.marker} ${p.seriesName}: <b>-${Number(p.value).toFixed(1)} Mt CO₂</b>`),
          `${t('waterfall.total-reduction', lang)}: <b>-${totalReduction.toFixed(1)} Mt CO₂</b>`,
          nz !== null ? `${t('waterfall.nz-emission', lang)}: <b>${nz.toFixed(1)} Mt CO₂</b>` : '',
        ];
        return lines.filter(Boolean).join('<br/>');
      },
    },
    legend: { top: 0, data: [...displayCategories, t('waterfall.bau-emission', lang), t('waterfall.nz-emission', lang)] },
    grid: { left: 70, right: 30, top: 50, bottom: 40 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      name: t('waterfall.yaxis', lang),
      nameLocation: 'middle',
      nameGap: 55,
    },
    series: [
      ...stackSeries,
      {
        name: t('waterfall.bau-emission', lang),
        type: 'line',
        data: bauLine,
        lineStyle: { width: 2.5, color: '#dc2626', type: 'dashed' },
        itemStyle: { color: '#dc2626' },
        symbol: 'diamond',
        symbolSize: 8,
        z: 10,
      },
      {
        name: t('waterfall.nz-emission', lang),
        type: 'line',
        data: nzLine,
        lineStyle: { width: 2.5, color: '#059669' },
        itemStyle: { color: '#059669' },
        symbol: 'circle',
        symbolSize: 8,
        z: 10,
      },
    ],
  };
}
