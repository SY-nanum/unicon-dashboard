'use client';

import dynamic from 'next/dynamic';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: IamcRow[] }

const VAR_LABEL: Record<string, string> = {
  'Secondary Energy|Electricity|Coal':  '석탄',
  'Secondary Energy|Electricity|Solar': '태양광',
  'Secondary Energy|Electricity|Total': '총 발전량',
};

const VAR_COLOR: Record<string, string> = {
  'Secondary Energy|Electricity|Coal':  '#475569',
  'Secondary Energy|Electricity|Solar': '#f59e0b',
  'Secondary Energy|Electricity|Total': '#2563eb',
};

// Mix variables shown as stacked bars; Total shown as line
const STACK_VARS = [
  'Secondary Energy|Electricity|Coal',
  'Secondary Energy|Electricity|Solar',
];

export function EnergyPowerMixChart({ rows }: Props) {
  if (!rows.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
        <span className="text-4xl">⚡</span>
        <p className="text-sm">전원 믹스 전망 데이터 제출 대기 중</p>
        <p className="text-xs">(NetZero 시나리오 발전량은 KEI팀 제출 후 업데이트)</p>
      </div>
    );
  }

  // Merge Historical + NetZero years
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const scenarios = [...new Set(rows.map((r) => r.scenario))];

  const series: object[] = [];

  // Historical stacked bars
  for (const v of STACK_VARS) {
    const histRows = rows.filter((r) => r.variable === v && r.scenario === 'Historical');
    if (!histRows.length) continue;
    series.push({
      name: VAR_LABEL[v] ?? v,
      type: 'bar',
      stack: 'hist',
      data: years.map((y) => histRows.find((r) => r.year === y)?.value ?? null),
      itemStyle: { color: VAR_COLOR[v] ?? '#6366f1' },
      barWidth: '35%',
    });
  }

  // NetZero stacked bars (if data exists)
  const hasNetZero = rows.some((r) => r.scenario === 'NetZero');
  if (hasNetZero) {
    for (const v of STACK_VARS) {
      const nzRows = rows.filter((r) => r.variable === v && r.scenario === 'NetZero');
      if (!nzRows.length) continue;
      series.push({
        name: `${VAR_LABEL[v] ?? v} (NetZero)`,
        type: 'bar',
        stack: 'nz',
        data: years.map((y) => nzRows.find((r) => r.year === y)?.value ?? null),
        itemStyle: { color: VAR_COLOR[v] ?? '#6366f1', opacity: 0.75 },
        barWidth: '35%',
      });
    }
  }

  // Total demand line (Historical)
  const totalVar = 'Secondary Energy|Electricity|Total';
  const totalHist = rows.filter((r) => r.variable === totalVar && r.scenario === 'Historical');
  if (totalHist.length) {
    series.push({
      name: '총 발전량 (Historical)',
      type: 'line',
      data: years.map((y) => totalHist.find((r) => r.year === y)?.value ?? null),
      lineStyle: { color: VAR_COLOR[totalVar], width: 2.5 },
      itemStyle: { color: VAR_COLOR[totalVar] },
      symbol: 'circle',
      symbolSize: 6,
      connectNulls: false,
    });
  }

  const histYears = years.filter((y) => y <= 2022);
  const projYears = years.filter((y) => y >= 2025);

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: 65, right: 20, bottom: 60, top: 20 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'TWh',
      nameLocation: 'middle',
      nameGap: 50,
    },
    // Shade projection zone
    visualMap: undefined as unknown,
    markArea: undefined as unknown,
    series,
  };

  const hasData = rows.some((r) => r.value != null);

  return (
    <div>
      {hasData ? (
        <>
          {projYears.length === 0 && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              ⚠️ 현재 2020~2022년 실적 데이터만 있습니다. NetZero 전망치는 KEI팀 제출 후 자동 반영됩니다.
            </div>
          )}
          <p className="mb-2 text-center text-xs text-slate-400">
            막대: 전원별 발전량 구성 &nbsp;|&nbsp; 선: 총 발전량 추이
          </p>
          <ReactECharts option={option} style={{ height: 380 }} notMerge />
        </>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
          <span className="text-4xl">⚡</span>
          <p className="text-sm">전원 믹스 전망 데이터 제출 대기 중</p>
        </div>
      )}
    </div>
  );
}
