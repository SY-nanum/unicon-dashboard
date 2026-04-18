'use client';

// Design System: ChartTabs.jsx — scenario chips with max-2 rule (oldest drops on 3rd selection)

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const SC_COLORS: Record<string, string> = {
  Historical: '#64748b',  // --scenario-historical
  BAU:        '#dc2626',  // --scenario-bau
  NetZero:    '#059669',  // --scenario-netzero
};

const MAX_SELECTED = 2;

export function TransportGhgChart({ rows, scenarios }: { rows: IamcRow[]; scenarios: string[] }) {
  const [selected, setSelected] = useState<string[]>(scenarios.slice(0, MAX_SELECTED));

  function toggle(s: string) {
    setSelected((prev) => {
      if (prev.includes(s)) {
        // deselect
        return prev.filter((x) => x !== s);
      }
      if (prev.length >= MAX_SELECTED) {
        // drop oldest (first in array), add new
        return [...prev.slice(1), s];
      }
      return [...prev, s];
    });
  }

  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

  const series = scenarios.map((sc) => ({
    name: sc,
    type: 'line' as const,
    smooth: true,
    data: years.map((y) => rows.find((r) => r.scenario === sc && r.year === y)?.value ?? null),
    lineStyle: {
      color: SC_COLORS[sc] ?? '#6366f1',
      width: 2,
      type: sc === 'BAU' ? 'dashed' : 'solid',
    },
    itemStyle: { color: SC_COLORS[sc] ?? '#6366f1' },
    symbol: 'circle',
    symbolSize: 5,
    connectNulls: false,
  }));

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      bottom: 0,
      selected: Object.fromEntries(scenarios.map((s) => [s, selected.includes(s)])),
    },
    grid: { left: 70, right: 20, bottom: 60, top: 10 },
    xAxis: { type: 'category', data: years.map(String) },
    yAxis: { type: 'value', name: 'Mt CO₂eq', nameLocation: 'middle', nameGap: 55 },
    series,
  };

  return (
    <div>
      {/* Scenario chips — max 2 active */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-slate-500">시나리오:</span>
        {scenarios.map((s) => {
          const on = selected.includes(s);
          const color = SC_COLORS[s] ?? '#6366f1';
          return (
            <button key={s}
              onClick={() => toggle(s)}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-medium transition-all"
              style={{
                border: `2px solid ${on ? color : '#94a3b8'}`,
                background: on ? color : '#fff',
                color: on ? '#fff' : '#475569',
              }}>
              {on && (
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {s}
            </button>
          );
        })}
        <span className="text-xs text-slate-400">(최대 {MAX_SELECTED}개)</span>
      </div>
      <ReactECharts option={option} style={{ height: 400, width: '100%' }} notMerge={true} />
    </div>
  );
}
