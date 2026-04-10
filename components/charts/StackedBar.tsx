'use client';

// Design Ref: §4.5, §5.2 — Grouped stacked bar chart for scenario comparison
// Plan SC-01, SC-02: renders real IamcRows; grouped stacks enable 2-scenario overlay

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import type { EChartsOption } from 'echarts';
import type { IamcRow } from '@/lib/iamc/types';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

// Design Ref: AD-6 — SSR-safe wrapper via dynamic import
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface StackedBarProps {
  rows: IamcRow[];
  /** Field whose distinct values become the stacks within each bar (e.g. 'variable' → tech stacks) */
  stackKey: keyof Pick<IamcRow, 'variable' | 'scenario' | 'region'>;
  /** Optional: field whose distinct values become adjacent bar groups at each X tick (e.g. 'scenario') */
  groupKey?: keyof Pick<IamcRow, 'variable' | 'scenario' | 'region'>;
  title?: string;
  yAxisLabel?: string;
  /** Tech color palette: variable name → hex color */
  stackColors?: Record<string, string>;
}

export function StackedBar({
  rows,
  stackKey,
  groupKey,
  title,
  yAxisLabel,
  stackColors,
}: StackedBarProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') as Lang) || DEFAULT_LANG;
  const option = buildEChartsOption(rows, stackKey, groupKey, title, yAxisLabel, stackColors, lang);

  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height: 480, width: '100%' }} notMerge={true} />
    </div>
  );
}

function buildEChartsOption(
  rows: IamcRow[],
  stackKey: StackedBarProps['stackKey'],
  groupKey: StackedBarProps['groupKey'] | undefined,
  title: string | undefined,
  yAxisLabel: string | undefined,
  stackColors: Record<string, string> | undefined,
  lang: Lang,
): EChartsOption {
  const years = uniqueSorted(rows.map((r) => r.year), (a, b) => a - b);
  const stacks = uniqueSorted(rows.map((r) => String(r[stackKey])));
  const groups = groupKey
    ? uniqueSorted(rows.map((r) => String(r[groupKey])))
    : [''];

  // Plan SC-03: series are built by iterating over distinct stack values discovered from data.
  // Adding a new variable to the xlsx → appears as a new series with no code changes.
  const series: EChartsOption['series'] = [];
  for (const group of groups) {
    for (const stack of stacks) {
      const data = years.map((year) => {
        const row = rows.find(
          (r) =>
            r.year === year &&
            String(r[stackKey]) === stack &&
            (!groupKey || String(r[groupKey]) === group),
        );
        return row ? row.value : null;
      });

      const stackGroupId = group || 'default';
      series.push({
        name: group ? `${group} · ${stack}` : stack,
        type: 'bar',
        stack: stackGroupId,
        data,
        itemStyle: stackColors?.[stack] ? { color: stackColors[stack] } : undefined,
        // Dim scenarios beyond the first group so tech colors remain consistent but groups are distinguishable
        emphasis: { focus: 'series' },
      });
    }
  }

  // Build X-axis categories; when groupKey present, ECharts 'stack' param creates grouped stacks side-by-side
  // by giving each group a different stack name.
  const sampleUnit = rows[0]?.unit ?? '';

  return {
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 16 } } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const year = params[0].axisValue;
        const lines = params
          .filter((p: any) => p.value !== null && p.value !== undefined)
          .map((p: any) => {
            const [grp, stk] = String(p.seriesName).split(' · ');
            const label = stk ? `${grp} · ${stk}` : grp;
            return `${p.marker} ${label}: <b>${p.value}</b> ${sampleUnit}`;
          });
        return [`<b>${year}</b>`, ...lines].join('<br/>');
      },
    },
    legend: {
      bottom: 0,
      type: 'scroll',
    },
    grid: { left: 60, right: 30, top: title ? 50 : 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      name: t('axis.year', lang),
      nameLocation: 'middle',
      nameGap: 30,
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel ?? sampleUnit,
      nameLocation: 'middle',
      nameGap: 45,
    },
    series,
  };
}

function uniqueSorted<T>(arr: T[], cmp?: (a: T, b: T) => number): T[] {
  return Array.from(new Set(arr)).sort(cmp);
}
