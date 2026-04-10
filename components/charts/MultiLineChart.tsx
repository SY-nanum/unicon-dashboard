'use client';

// Multi-scenario line chart for IAMC long-format rows.
// One smooth line per distinct value of `groupKey` (default: 'scenario').

import dynamic from 'next/dynamic';
import type { EChartsOption, LineSeriesOption } from 'echarts';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props {
  rows: IamcRow[];
  groupKey?: keyof Pick<IamcRow, 'scenario' | 'variable' | 'region'>;
  groupColors?: Record<string, string>;
  /** Optional styling hints per group (e.g. dashed for NetZero) */
  groupStyles?: Record<string, { lineType?: 'solid' | 'dashed'; symbol?: string }>;
  yAxisLabel?: string;
  groupOrder?: string[];
  height?: number;
}

export function MultiLineChart({
  rows,
  groupKey = 'scenario',
  groupColors,
  groupStyles,
  yAxisLabel,
  groupOrder,
  height = 420,
}: Props) {
  const option = buildOption(rows, groupKey, groupColors, groupStyles, yAxisLabel, groupOrder);
  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height, width: '100%' }} notMerge={true} />
    </div>
  );
}

function buildOption(
  rows: IamcRow[],
  groupKey: NonNullable<Props['groupKey']>,
  groupColors: Record<string, string> | undefined,
  groupStyles: Props['groupStyles'] | undefined,
  yAxisLabel: string | undefined,
  groupOrderPref: string[] | undefined,
): EChartsOption {
  const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
  const groupsDiscovered = Array.from(new Set(rows.map((r) => String(r[groupKey]))));
  const groups = groupOrderPref
    ? [...groupOrderPref.filter((g) => groupsDiscovered.includes(g)),
       ...groupsDiscovered.filter((g) => !groupOrderPref.includes(g))]
    : groupsDiscovered;

  const unit = rows[0]?.unit ?? '';

  const series: LineSeriesOption[] = groups.map((group) => {
    const style = groupStyles?.[group];
    const color = groupColors?.[group];
    const data = years.map((year) => {
      const match = rows.find((r) => r.year === year && String(r[groupKey]) === group);
      return match ? match.value : null;
    });
    return {
      name: group,
      type: 'line',
      smooth: 0.3,
      symbol: style?.symbol ?? 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2.5,
        color,
        type: style?.lineType ?? 'solid',
      },
      itemStyle: color ? { color } : undefined,
      data,
      connectNulls: false,
      emphasis: { focus: 'series' },
    };
  });

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!Array.isArray(params)) return '';
        const year = params[0].axisValue;
        const lines = params
          .filter((p: any) => p.value !== null && p.value !== undefined)
          .map(
            (p: any) => `${p.marker} ${p.seriesName}: <b>${Number(p.value).toFixed(2)} ${unit}</b>`,
          );
        return [`<b>${year}</b>`, ...lines].join('<br/>');
      },
    },
    legend: { top: 0, data: groups },
    grid: { left: 70, right: 30, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel ?? unit,
      nameLocation: 'middle',
      nameGap: 50,
      scale: true,
    },
    series,
  };
}
