'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const SC_COLORS: Record<string, string> = {
  BAU:            '#dc2626',
  'BAU-Damage':   '#f87171',
  NetZero:        '#059669',
  'NetZero-Damage': '#34d399',
};

const SC_LABELS: Record<string, string> = {
  BAU:              'BAU (피해 미반영)',
  'BAU-Damage':     'BAU-Damage (피해 반영)',
  NetZero:          'NetZero (피해 미반영)',
  'NetZero-Damage': 'NetZero-Damage (피해 반영)',
};

const PROJ_SCENARIOS = ['BAU', 'BAU-Damage', 'NetZero', 'NetZero-Damage'];
const DEFAULT_SELECTED = ['BAU', 'NetZero'];

export function IntGhgPathwayChart({
  globalRows,
  korHistRows,
}: {
  globalRows: IamcRow[];
  korHistRows: IamcRow[];
}) {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);

  const availableScenarios = PROJ_SCENARIOS.filter((s) =>
    globalRows.some((r) => r.scenario === s),
  );

  function toggle(s: string) {
    setSelected((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= 2) return [...prev.slice(1), s];
      return [...prev, s];
    });
  }

  // Merge all years
  const globalYears = [...new Set(globalRows.map((r) => r.year))].sort((a, b) => a - b);
  const histYears = [...new Set(korHistRows.map((r) => r.year))].sort((a, b) => a - b);
  const allYears = [...new Set([...histYears, ...globalYears])].sort((a, b) => a - b);

  const series: object[] = [];

  // KOR Historical reference line (secondary axis or same axis — use same for clarity)
  if (korHistRows.length > 0) {
    series.push({
      name: '한국 실적 (KOR Historical)',
      type: 'line',
      yAxisIndex: 1,
      smooth: false,
      connectNulls: false,
      data: allYears.map((y) => korHistRows.find((r) => r.year === y)?.value ?? null),
      lineStyle: { color: '#64748b', width: 2, type: 'solid' },
      itemStyle: { color: '#64748b' },
      symbol: 'circle',
      symbolSize: 5,
    });
  }

  // Global scenario lines
  for (const sc of availableScenarios) {
    if (!selected.includes(sc)) continue;
    series.push({
      name: SC_LABELS[sc] ?? sc,
      type: 'line',
      yAxisIndex: 0,
      smooth: false,
      connectNulls: false,
      data: allYears.map((y) => globalRows.find((r) => r.scenario === sc && r.year === y)?.value ?? null),
      lineStyle: {
        color: SC_COLORS[sc] ?? '#6366f1',
        width: 2.5,
        type: sc.includes('Damage') ? 'dashed' : 'solid',
      },
      itemStyle: { color: SC_COLORS[sc] ?? '#6366f1' },
      symbol: 'circle',
      symbolSize: 5,
      areaStyle: sc === 'NetZero'
        ? { color: 'rgba(5,150,105,0.08)' }
        : sc === 'BAU'
        ? { color: 'rgba(220,38,38,0.06)' }
        : undefined,
    });
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
        if (!params.length) return '';
        const year = params[0].axisValue;
        const lines = params
          .filter((p) => p.value != null)
          .map(
            (p) =>
              `${p.seriesName}: <b>${p.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b> Mt CO₂eq`,
          );
        return `<div class="text-xs"><div class="font-semibold mb-1">${year}년</div>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { bottom: 0 },
    grid: { left: 80, right: 80, bottom: 70, top: 20 },
    xAxis: {
      type: 'category',
      data: allYears.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Mt CO₂eq\n(Global)',
        nameLocation: 'middle',
        nameGap: 65,
        axisLabel: { formatter: (v: number) => v.toLocaleString() },
      },
      {
        type: 'value',
        name: 'Mt CO₂eq\n(KOR)',
        nameLocation: 'middle',
        nameGap: 55,
        axisLabel: { formatter: (v: number) => v.toLocaleString() },
        splitLine: { show: false },
      },
    ],
    series,
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm font-medium text-slate-500">글로벌 시나리오:</span>
        {availableScenarios.map((s) => {
          const on = selected.includes(s);
          const color = SC_COLORS[s] ?? '#6366f1';
          return (
            <button
              key={s}
              onClick={() => toggle(s)}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-medium transition-all"
              style={{
                border: `2px solid ${on ? color : '#94a3b8'}`,
                background: on ? color : '#fff',
                color: on ? '#fff' : '#64748b',
              }}
            >
              {SC_LABELS[s] ?? s}
            </button>
          );
        })}
      </div>
      <p className="mb-2 text-center text-xs text-slate-400">
        좌축: 글로벌 전망 (Global) &nbsp;|&nbsp; 우축: 한국 실적 (KOR Historical, 회색 선)
      </p>
      <ReactECharts option={option} style={{ height: 380 }} notMerge />
    </div>
  );
}
