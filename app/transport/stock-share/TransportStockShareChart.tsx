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

export function TransportStockShareChart({ rows, scenarios }: { rows: IamcRow[]; scenarios: string[] }) {
  const projScenarios = scenarios.filter((s) => s !== 'Historical');
  const [selected, setSelected] = useState<string>(projScenarios[0] ?? 'NetZero');

  const labeled = rows
    .filter((r) => r.variable in VAR_TO_LABEL)
    .map((r) => ({ ...r, variable: VAR_TO_LABEL[r.variable] }));

  const historicalRows = labeled.filter((r) => r.scenario === 'Historical');
  const projectionRows = labeled.filter((r) => r.scenario === selected);
  const allYears = [...new Set([...historicalRows, ...projectionRows].map((r) => r.year))].sort((a, b) => a - b);

  const series = PT_ORDER.map((pt) => ({
    name: pt,
    type: 'bar' as const,
    stack: 'share',
    data: allYears.map((y) => {
      const hist = historicalRows.find((r) => r.variable === pt && r.year === y);
      const proj = projectionRows.find((r) => r.variable === pt && r.year === y);
      const val = hist?.value ?? proj?.value ?? null;
      // Calculate total for this year to get percentage
      const totalHist = PT_ORDER.reduce((s, p) => s + (historicalRows.find((r) => r.variable === p && r.year === y)?.value ?? 0), 0);
      const totalProj = PT_ORDER.reduce((s, p) => s + (projectionRows.find((r) => r.variable === p && r.year === y)?.value ?? 0), 0);
      const total = totalHist || totalProj;
      return val !== null && total > 0 ? Math.round((val / total) * 1000) / 10 : null;
    }),
    itemStyle: { color: PT_COLORS[pt] },
  }));

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: 60, right: 20, bottom: 60, top: 20 },
    xAxis: { type: 'category', data: allYears.map(String) },
    yAxis: { type: 'value', name: '비율 (%)', nameLocation: 'middle', nameGap: 40, max: 100 },
    series,
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 text-center">파워트레인별 차량 등록대수 구성비</h2>
      <div className="mt-3 flex justify-center gap-2">
        {projScenarios.map((s) => (
          <button key={s} onClick={() => setSelected(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              selected === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>{s}</button>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 420, width: '100%' }} notMerge={true} />
    </div>
  );
}
