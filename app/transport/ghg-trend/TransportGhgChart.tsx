'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const SC_COLORS: Record<string, string> = {
  Historical: '#64748b',
  BAU:        '#ef4444',
  NetZero:    '#10b981',
};

export function TransportGhgChart({ rows, scenarios }: { rows: IamcRow[]; scenarios: string[] }) {
  const [selected, setSelected] = useState<string[]>(scenarios);

  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

  const series = scenarios.map((sc) => ({
    name: sc,
    type: 'line' as const,
    smooth: true,
    data: years.map((y) => rows.find((r) => r.scenario === sc && r.year === y)?.value ?? null),
    lineStyle: { color: SC_COLORS[sc] ?? '#6366f1', width: 2 },
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
    grid: { left: 70, right: 20, bottom: 60, top: 20 },
    xAxis: { type: 'category', data: years.map(String) },
    yAxis: { type: 'value', name: '배출량 (ktCO₂)', nameLocation: 'middle', nameGap: 55 },
    series,
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 text-center">온실가스 배출 추이</h2>
      <div className="mt-3 flex justify-center gap-2">
        {scenarios.map((s) => (
          <button key={s}
            onClick={() => setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              selected.includes(s) ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={selected.includes(s) ? { backgroundColor: SC_COLORS[s] ?? '#6366f1' } : {}}>
            {s}
          </button>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 420, width: '100%' }} notMerge={true} />
    </div>
  );
}
