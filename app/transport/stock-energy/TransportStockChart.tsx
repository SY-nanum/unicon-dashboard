'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const VAR_TO_LABEL: Record<string, string> = {
  'Stock|Transportation|Total|ICEV':   '내연기관(ICEV)',
  'Stock|Transportation|Total|BEV':    '전기차(BEV)',
  'Stock|Transportation|Freight|FCEV': '수소차(FCEV)',
};
const PT_COLORS: Record<string, string> = {
  '내연기관(ICEV)': '#94a3b8',
  '전기차(BEV)':    '#3b82f6',
  '수소차(FCEV)':   '#10b981',
};
const PT_ORDER = ['내연기관(ICEV)', '전기차(BEV)', '수소차(FCEV)'];

export function TransportStockChart({ rows, scenarios }: { rows: IamcRow[]; scenarios: string[] }) {
  const [selected, setSelected] = useState<string[]>(
    scenarios.filter((s) => s !== 'Historical').slice(0, 1)
  );

  const activeScenarios = ['Historical', ...selected];
  const filtered = rows
    .filter((r) => activeScenarios.includes(r.scenario) && r.variable in VAR_TO_LABEL)
    .map((r) => ({ ...r, variable: VAR_TO_LABEL[r.variable] }));

  const years = [...new Set(filtered.map((r) => r.year))].sort((a, b) => a - b);

  const series = PT_ORDER.map((pt) => ({
    name: pt,
    type: 'bar' as const,
    stack: 'total',
    data: years.map((y) => {
      const sc = y <= 2022 ? 'Historical' : (selected[0] ?? 'NetZero');
      return filtered.find((r) => r.scenario === sc && r.variable === pt && r.year === y)?.value ?? null;
    }),
    itemStyle: { color: PT_COLORS[pt] },
  }));

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: 70, right: 20, bottom: 60, top: 20 },
    xAxis: { type: 'category', data: years.map(String) },
    yAxis: { type: 'value', name: '대수 (천대)', nameLocation: 'middle', nameGap: 50 },
    series,
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 text-center">파워트레인별 차량 보급 대수 및 총 에너지 수요</h2>
      <div className="mt-3 flex justify-center gap-2">
        {scenarios.filter((s) => s !== 'Historical').map((s) => (
          <button
            key={s}
            onClick={() => setSelected([s])}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              selected.includes(s) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 420, width: '100%' }} notMerge={true} />
    </div>
  );
}
