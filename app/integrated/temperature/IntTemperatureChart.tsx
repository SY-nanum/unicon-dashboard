'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const SC_COLORS: Record<string, string> = {
  Historical:       '#64748b',
  BAU:              '#dc2626',
  'BAU-Damage':     '#f87171',
  NetZero:          '#059669',
  'NetZero-Damage': '#34d399',
  'SSP1-2.6':       '#7c3aed',
  'SSP5-8.5':       '#f59e0b',
};

const SC_LABELS: Record<string, string> = {
  Historical:       '실적 (Historical)',
  BAU:              'BAU',
  'BAU-Damage':     'BAU-Damage',
  NetZero:          'NetZero',
  'NetZero-Damage': 'NetZero-Damage',
  'SSP1-2.6':       'SSP1-2.6 (2.0°C 이하)',
  'SSP5-8.5':       'SSP5-8.5 (고탄소)',
};

const SC_ORDER = ['Historical', 'BAU', 'BAU-Damage', 'NetZero', 'NetZero-Damage', 'SSP1-2.6', 'SSP5-8.5'];
const DEFAULT_SELECTED = ['Historical', 'BAU', 'NetZero'];

export function IntTemperatureChart({ rows }: { rows: IamcRow[] }) {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);

  const availableScenarios = SC_ORDER.filter((s) => rows.some((r) => r.scenario === s));

  function toggle(s: string) {
    setSelected((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= 3) return [...prev.slice(1), s];
      return [...prev, s];
    });
  }

  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

  const series: object[] = [];

  // 1.5°C reference line (Paris target)
  series.push({
    name: '파리협정 목표 (1.5°C)',
    type: 'line',
    data: years.map(() => 1.5),
    lineStyle: { color: '#f59e0b', width: 1.5, type: 'dotted' },
    itemStyle: { color: '#f59e0b' },
    symbol: 'none',
    markLine: undefined,
  });

  // 2.0°C reference line
  series.push({
    name: '2.0°C 목표선',
    type: 'line',
    data: years.map(() => 2.0),
    lineStyle: { color: '#ef4444', width: 1, type: 'dotted' },
    itemStyle: { color: '#ef4444' },
    symbol: 'none',
  });

  // Scenario lines
  for (const sc of availableScenarios) {
    if (!selected.includes(sc)) continue;
    const isHist = sc === 'Historical';
    series.push({
      name: SC_LABELS[sc] ?? sc,
      type: 'line',
      smooth: true,
      connectNulls: false,
      data: years.map((y) => rows.find((r) => r.scenario === sc && r.year === y)?.value ?? null),
      lineStyle: {
        color: SC_COLORS[sc] ?? '#6366f1',
        width: isHist ? 3 : 2.5,
        type: sc.includes('Damage') || sc.startsWith('SSP') ? 'dashed' : 'solid',
      },
      itemStyle: { color: SC_COLORS[sc] ?? '#6366f1' },
      symbol: isHist ? 'circle' : 'none',
      symbolSize: 4,
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
          .map((p) => `${p.seriesName}: <b>${p.value?.toFixed(2)}°C</b>`);
        return `<div class="text-xs"><div class="font-semibold mb-1">${year}년</div>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { bottom: 0, itemWidth: 20 },
    grid: { left: 60, right: 20, bottom: 80, top: 20 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: '°C',
      nameLocation: 'middle',
      nameGap: 40,
      min: 1.0,
      axisLabel: { formatter: (v: number) => `${v.toFixed(1)}°C` },
    },
    series,
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm font-medium text-slate-500">시나리오:</span>
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
        점선: 파리협정 1.5°C 목표 &nbsp;|&nbsp; SSP 시나리오 데이터는 추후 업데이트 예정
      </p>
      <ReactECharts option={option} style={{ height: 380 }} notMerge />
    </div>
  );
}
