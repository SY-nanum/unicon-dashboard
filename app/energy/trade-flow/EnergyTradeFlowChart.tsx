'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { AnnualTrade } from '@/lib/energy/loadYonseiTrade';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { annual: AnnualTrade[]; years: number[] }

// Display flow pairs (from→to)
const FLOW_PAIRS = [
  { from: 'KOR', to: 'JPN', label: 'KOR→JPN 수출', color: '#3b82f6' },
  { from: 'JPN', to: 'KOR', label: 'JPN→KOR 수입', color: '#93c5fd' },
  { from: 'KOR', to: 'CHN', label: 'KOR→CHN 수출', color: '#ef4444' },
  { from: 'CHN', to: 'KOR', label: 'CHN→KOR 수입', color: '#fca5a5' },
];

export function EnergyTradeFlowChart({ annual, years }: Props) {
  const [view, setView] = useState<'absolute' | 'net'>('absolute');

  // Net KOR balance per year (exports - imports)
  const netData = years.map((y) => {
    const korExport = annual
      .filter((a) => a.year === y && a.from === 'KOR')
      .reduce((s, a) => s + a.gwh, 0);
    const korImport = annual
      .filter((a) => a.year === y && a.to === 'KOR')
      .reduce((s, a) => s + a.gwh, 0);
    return Math.round((korExport - korImport) * 10) / 10;
  });

  const absoluteSeries: object[] = FLOW_PAIRS.map((fp) => ({
    name: fp.label,
    type: 'bar',
    data: years.map((y) => {
      const row = annual.find((a) => a.year === y && a.from === fp.from && a.to === fp.to);
      return row ? Math.round(row.gwh * 10) / 10 : 0;
    }),
    itemStyle: { color: fp.color },
    barMaxWidth: 35,
  }));

  const netSeries: object[] = [
    {
      name: 'KOR 순수출 (수출-수입)',
      type: 'bar',
      data: netData,
      itemStyle: {
        color: (params: { value: number }) =>
          params.value >= 0 ? '#3b82f6' : '#ef4444',
      },
      barMaxWidth: 40,
      label: {
        show: true,
        position: (params: { value: number }) => (params.value >= 0 ? 'top' : 'bottom'),
        formatter: (params: { value: number }) => `${params.value.toFixed(0)}`,
        fontSize: 10,
      },
    },
  ];

  const absoluteOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
        if (!params.length) return '';
        const year = params[0].axisValue;
        const lines = params
          .filter((p) => p.value > 1)
          .map((p) => `${p.seriesName}: <b>${(p.value / 1000).toFixed(2)} TWh/yr</b>`);
        return `<div class="text-xs"><b>${year}년</b><br/>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: 75, right: 20, bottom: 65, top: 20 },
    xAxis: { type: 'category', data: years.map(String) },
    yAxis: {
      type: 'value',
      name: 'GWh/yr',
      nameLocation: 'middle',
      nameGap: 60,
    },
    series: absoluteSeries,
  };

  const netOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { value: number; axisValue: string }[]) => {
        if (!params.length) return '';
        const { axisValue, value } = params[0];
        const dir = value >= 0 ? '순수출 (수출 우세)' : '순수입 (수입 우세)';
        return `<div class="text-xs"><b>${axisValue}년</b><br/>${dir}: <b>${Math.abs(value / 1000).toFixed(2)} TWh/yr</b></div>`;
      },
    },
    grid: { left: 75, right: 20, bottom: 45, top: 20 },
    xAxis: { type: 'category', data: years.map(String) },
    yAxis: {
      type: 'value',
      name: 'GWh/yr',
      nameLocation: 'middle',
      nameGap: 60,
    },
    series: netSeries,
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['absolute', 'net'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1 text-xs font-medium transition-colors ${
              view === v
                ? 'bg-blue-600 text-white'
                : 'border border-blue-400 text-slate-600 hover:bg-blue-50'
            }`}
          >
            {v === 'absolute' ? '방향별 교역량' : 'KOR 순수출 균형'}
          </button>
        ))}
      </div>

      {view === 'absolute' ? (
        <>
          <p className="text-center text-xs text-slate-400">
            연간 총 교역량 = 시뮬레이션 96 타임슬라이스 합산 × (8760/96) 시간
          </p>
          <ReactECharts option={absoluteOption} style={{ height: 380 }} notMerge />
        </>
      ) : (
        <>
          <p className="text-center text-xs text-slate-400">
            순수출 양수(↑) = KOR 수출 우세 &nbsp;|&nbsp; 순수출 음수(↓) = KOR 수입 우세
          </p>
          <ReactECharts option={netOption} style={{ height: 380 }} notMerge />
        </>
      )}

      {/* Flow summary table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-600">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-1 pr-4">교역 경로</th>
              {years.map((y) => (
                <th key={y} className="pb-1 pr-3 text-right">{y}년</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FLOW_PAIRS.map((fp) => {
              const hasData = annual.some((a) => a.from === fp.from && a.to === fp.to);
              if (!hasData) return null;
              return (
                <tr key={`${fp.from}-${fp.to}`} className="border-b border-slate-100">
                  <td className="py-1 pr-4 font-medium" style={{ color: fp.color }}>
                    {fp.label}
                  </td>
                  {years.map((y) => {
                    const row = annual.find((a) => a.year === y && a.from === fp.from && a.to === fp.to);
                    return (
                      <td key={y} className="py-1 pr-3 text-right">
                        {row ? `${(row.gwh / 1000).toFixed(2)} TWh` : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
        <b>동북아 전력 융통량:</b> UNICON POWER&CGE 모형의 KOR↔JPN, KOR↔CHN 전력 교역 시뮬레이션.
        현재 데이터는 2026·2029·2032년 전망치이며, 96 타임슬라이스(4계절×24시간) 기반 연간 집계.
        단위: GWh/yr.
      </div>
    </div>
  );
}
