'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const VAR_TO_LABEL: Record<string, string> = {
  'Final Energy|Transportation|Passenger|Liquids': '승용 액체연료',
  'Final Energy|Transportation|Bus|Liquids':       '버스 액체연료',
  'Final Energy|Transportation|Bus|Electricity':   '버스 전기',
  'Final Energy|Transportation|Freight|Electricity': '화물 전기',
};
const ENERGY_COLORS: Record<string, string> = {
  '승용 액체연료': '#94a3b8',
  '버스 액체연료': '#fb923c',
  '버스 전기':     '#3b82f6',
  '화물 전기':     '#10b981',
};
const ORDER = ['승용 액체연료', '버스 액체연료', '버스 전기', '화물 전기'];

export function TransportEnergyMixChart({ rows, scenarios }: { rows: IamcRow[]; scenarios: string[] }) {
  const projScenarios = scenarios.filter((s) => s !== 'Historical');
  const [selected, setSelected] = useState<string>(projScenarios[0] ?? 'NetZero');

  const labeled = rows
    .filter((r) => r.variable in VAR_TO_LABEL)
    .map((r) => ({ ...r, variable: VAR_TO_LABEL[r.variable] }));

  const historicalRows = labeled.filter((r) => r.scenario === 'Historical');
  const projectionRows = labeled.filter((r) => r.scenario === selected);
  const allYears = [...new Set([...historicalRows, ...projectionRows].map((r) => r.year))].sort((a, b) => a - b);

  const series = ORDER.map((label) => ({
    name: label,
    type: 'bar' as const,
    stack: 'total',
    data: allYears.map((y) => {
      const hist = historicalRows.find((r) => r.variable === label && r.year === y);
      const proj = projectionRows.find((r) => r.variable === label && r.year === y);
      return hist?.value ?? proj?.value ?? null;
    }),
    itemStyle: { color: ENERGY_COLORS[label] },
  }));

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: 70, right: 20, bottom: 60, top: 20 },
    xAxis: { type: 'category', data: allYears.map(String) },
    yAxis: { type: 'value', name: '에너지 (ktoe)', nameLocation: 'middle', nameGap: 55 },
    series,
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 text-center">차종별 에너지원 믹스</h2>
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
