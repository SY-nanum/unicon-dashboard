'use client';

// Design Ref: UNICON 통합DB 및 UI 구축방안 1.0.pdf page 19 — 공정기술 점유율 변화
// Vertical stacked bar + smooth trend lines through segment midpoints.
// Differentiates Historical (실측, grayscale) from Projection (예측, vivid colors) visually.

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import type { EChartsOption, LineSeriesOption, BarSeriesOption } from 'echarts';
import type { IamcRow } from '@/lib/iamc/types';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props {
  rows: IamcRow[];
  stackKey: keyof Pick<IamcRow, 'variable' | 'scenario' | 'region'>;
  stackColors?: Record<string, string>;
  title?: string;
  trendLines?: boolean;
  stackOrder?: string[];
  mode?: 'percent' | 'absolute';
  yAxisLabel?: string;
  /** Years < this are "historical" (draws a background band + tooltip label); >= is "projection". */
  projectionCutoff?: number;
}

export function Percent100StackedWithTrend({
  rows,
  stackKey,
  stackColors,
  title,
  trendLines = true,
  stackOrder,
  mode = 'absolute',
  yAxisLabel,
  projectionCutoff,
}: Props) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') as Lang) || DEFAULT_LANG;
  const option = buildOption(
    rows, stackKey, stackColors, title, trendLines, stackOrder,
    mode, yAxisLabel, projectionCutoff, lang,
  );
  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height: 480, width: '100%' }} notMerge={true} />
    </div>
  );
}

function buildOption(
  rows: IamcRow[],
  stackKey: Props['stackKey'],
  stackColors: Record<string, string> | undefined,
  title: string | undefined,
  trendLines: boolean,
  stackOrderPref: string[] | undefined,
  mode: 'percent' | 'absolute',
  yAxisLabelOverride: string | undefined,
  projectionCutoff: number | undefined,
  lang: Lang,
): EChartsOption {
  const years = uniq(rows.map((r) => r.year)).sort((a, b) => a - b);
  const stacksDiscovered = uniq(rows.map((r) => String(r[stackKey])));
  const stacks = stackOrderPref
    ? [...stackOrderPref.filter((s) => stacksDiscovered.includes(s)),
       ...stacksDiscovered.filter((s) => !stackOrderPref.includes(s))]
    : stacksDiscovered;

  const isHistorical = (year: number): boolean =>
    projectionCutoff !== undefined && year < projectionCutoff;

  // Absolute values
  const absMatrix: Record<string, (number | null)[]> = {};
  for (const stack of stacks) {
    absMatrix[stack] = years.map((year) => {
      const row = rows.find((r) => r.year === year && String(r[stackKey]) === stack);
      return row && Number.isFinite(row.value) ? row.value : null;
    });
  }

  const totals = new Map<number, number>();
  for (const year of years) {
    const t = rows.filter((r) => r.year === year).reduce((s, r) => s + (Number.isFinite(r.value) ? r.value : 0), 0);
    totals.set(year, t);
  }

  const sharePct = (year: number, value: number): number => {
    const total = totals.get(year) ?? 0;
    return total > 0 ? (value / total) * 100 : 0;
  };

  // Display matrix (percent or absolute)
  const displayMatrix: Record<string, (number | null)[]> = {};
  for (const stack of stacks) {
    displayMatrix[stack] = absMatrix[stack].map((v, yi) => {
      if (v === null) return null;
      if (mode === 'percent') return sharePct(years[yi], v);
      return v;
    });
  }

  // Bar series — vivid colors throughout (historical period indicated by background band instead)
  const unit = rows[0]?.unit ?? '';
  const barSeries: BarSeriesOption[] = stacks.map((stack) => ({
    name: stack,
    type: 'bar',
    stack: 'share',
    barMaxWidth: 48,
    data: displayMatrix[stack],
    itemStyle: stackColors?.[stack] ? { color: stackColors[stack] } : undefined,
    emphasis: { focus: 'series' },
    label: {
      show: true,
      position: 'insideTop',
      distance: 6,
      formatter: (p: any) => {
        if (p.value === null) return '';
        const year = years[p.dataIndex];
        const rawAbs = absMatrix[stack][p.dataIndex];
        if (rawAbs === null) return '';
        const pct = sharePct(year, rawAbs);
        return pct >= 3 ? `${Math.round(pct)}%` : '';
      },
      color: '#0f172a',
      fontSize: 12,
      fontWeight: 700,
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      padding: [3, 7],
      borderRadius: 10,
    },
    labelLayout: { hideOverlap: true },
  }));

  // Trend lines — color per data point too, so the line smoothly fades into gray over historical years
  const lineSeries: LineSeriesOption[] = trendLines
    ? stacks.map((stack, k) => {
        const data = years.map((year, yi) => {
          if (displayMatrix[stack][yi] === null) return null as any;
          let below = 0;
          for (let j = 0; j < k; j++) {
            const v = displayMatrix[stacks[j]][yi];
            if (v === null) return null as any;
            below += v;
          }
          return below + (displayMatrix[stack][yi] as number) / 2;
        });
        return {
          name: `${stack} (${t('label.trend', lang)})`,
          type: 'line',
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 2, color: stackColors?.[stack], type: 'solid' },
          itemStyle: stackColors?.[stack] ? { color: stackColors[stack] } : undefined,
          data,
          z: 5,
          connectNulls: false,
          tooltip: { show: false },
        };
      })
    : [];

  // Historical background band (markArea behind historical year columns)
  let historicalBand: any = undefined;
  if (projectionCutoff !== undefined) {
    const histYears = years.filter((y) => y < projectionCutoff).map(String);
    if (histYears.length > 0) {
      historicalBand = {
        silent: true,
        itemStyle: { color: 'rgba(148, 163, 184, 0.12)' }, // slate-400 @ 12%
        data: [
          [
            { xAxis: histYears[0], name: t('label.actual', lang) },
            { xAxis: histYears[histYears.length - 1] },
          ],
        ],
        label: {
          show: true,
          position: 'insideTop',
          color: '#64748b',
          fontSize: 11,
          fontWeight: 600,
          distance: 4,
        },
      };
    }
  }

  // Attach markArea to the first bar series (needs to live on some series)
  if (historicalBand && barSeries.length > 0) {
    (barSeries[0] as any).markArea = historicalBand;
  }

  const yAxisName =
    yAxisLabelOverride ?? (mode === 'percent' ? t('axis.share-pct', lang) : `${t('axis.capacity', lang)} (${unit})`);

  return {
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 16 } } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return '';
        const year = params[0].axisValue;
        const bars = params.filter((p: any) => p.seriesType === 'bar' && p.value !== null);
        const yr = Number(year);
        const total = totals.get(yr) ?? 0;
        const period = isHistorical(yr) ? `<span style="color:#64748b">${t('label.actual', lang)}</span>` : `<span style="color:#2563eb">${t('label.forecast', lang)}</span>`;
        const lines = bars
          .map((p: any) => {
            const rawAbs = absMatrix[p.seriesName]?.[p.dataIndex];
            if (rawAbs === null || rawAbs === undefined) return '';
            const pct = total > 0 ? ((rawAbs / total) * 100).toFixed(1) : '—';
            return `${p.marker} ${p.seriesName}: <b>${rawAbs.toFixed(1)} ${unit}</b> (${pct}%)`;
          })
          .filter(Boolean);
        const totalLine =
          mode === 'absolute' && total > 0
            ? `<span style="color:#888">${t('label.total', lang)}: ${total.toFixed(1)} ${unit}</span>`
            : '';
        return [`<b>${year}</b> · ${period}`, ...lines, totalLine].filter(Boolean).join('<br/>');
      },
    },
    legend: {
      bottom: 0,
      data: stacks,
    },
    grid: { left: 80, right: 30, top: title ? 50 : 30, bottom: 60 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      name: t('axis.year', lang),
      nameLocation: 'middle',
      nameGap: 30,
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameLocation: 'middle',
      nameGap: 60,
      min: 0,
      max: mode === 'percent' ? 100 : undefined,
      axisLabel: { formatter: mode === 'percent' ? '{value}%' : '{value}' },
    },
    series: [...barSeries, ...lineSeries],
  };
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
