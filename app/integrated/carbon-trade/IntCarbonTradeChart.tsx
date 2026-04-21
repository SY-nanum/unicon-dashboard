'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const SC_COLORS: Record<string, string> = {
  BAU:              '#dc2626',
  'BAU-Damage':     '#f87171',
  NetZero:          '#059669',
  'NetZero-Damage': '#34d399',
  Historical:       '#64748b',
};

const SC_LABELS: Record<string, string> = {
  BAU:              'BAU',
  'BAU-Damage':     'BAU-Damage',
  NetZero:          'NetZero',
  'NetZero-Damage': 'NetZero-Damage',
  Historical:       '실적 (Historical)',
};

const CARBON_SCENARIOS = ['BAU', 'BAU-Damage', 'NetZero', 'NetZero-Damage'];
const DEFAULT_SELECTED = ['BAU', 'NetZero'];

export function IntCarbonTradeChart({
  carbonRows,
  tradeRows,
}: {
  carbonRows: IamcRow[];
  tradeRows: IamcRow[];
}) {
  const [tab, setTab] = useState<'carbon' | 'trade'>('carbon');
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);

  const availCarbon = CARBON_SCENARIOS.filter((s) =>
    carbonRows.some((r) => r.scenario === s),
  );
  const availTrade = [...new Set(tradeRows.map((r) => r.scenario))];

  function toggle(s: string) {
    setSelected((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= 2) return [...prev.slice(1), s];
      return [...prev, s];
    });
  }

  // ─── Carbon price chart ───────────────────────────────────────────────
  const carbonYears = [...new Set(carbonRows.map((r) => r.year))].sort((a, b) => a - b);
  const carbonSeries = availCarbon
    .filter((s) => selected.includes(s))
    .map((sc) => ({
      name: SC_LABELS[sc] ?? sc,
      type: 'line',
      smooth: true,
      connectNulls: false,
      data: carbonYears.map(
        (y) => carbonRows.find((r) => r.scenario === sc && r.year === y)?.value ?? null,
      ),
      lineStyle: {
        color: SC_COLORS[sc] ?? '#6366f1',
        width: 2.5,
        type: sc.includes('Damage') ? 'dashed' : 'solid',
      },
      itemStyle: { color: SC_COLORS[sc] ?? '#6366f1' },
      symbol: 'circle',
      symbolSize: 5,
    }));

  const carbonOption = {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 70, right: 20, bottom: 60, top: 20 },
    xAxis: {
      type: 'category',
      data: carbonYears.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'USD/tCO₂',
      nameLocation: 'middle',
      nameGap: 55,
    },
    series: carbonSeries,
  };

  // ─── Trade export chart ───────────────────────────────────────────────
  const tradeYears = [...new Set(tradeRows.map((r) => r.year))].sort((a, b) => a - b);
  const tradeSeries = availTrade.map((sc) => ({
    name: SC_LABELS[sc] ?? sc,
    type: sc === 'Historical' ? 'bar' : 'line',
    smooth: true,
    connectNulls: false,
    data: tradeYears.map(
      (y) => tradeRows.find((r) => r.scenario === sc && r.year === y)?.value ?? null,
    ),
    lineStyle: { color: SC_COLORS[sc] ?? '#6366f1', width: 2.5 },
    itemStyle: { color: SC_COLORS[sc] ?? '#6366f1' },
    symbol: 'circle',
    symbolSize: 5,
    barWidth: '40%',
  }));

  const tradeOption = {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: { left: 70, right: 20, bottom: 60, top: 20 },
    xAxis: {
      type: 'category',
      data: tradeYears.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'Billion USD',
      nameLocation: 'middle',
      nameGap: 60,
    },
    series: tradeSeries,
  };

  const hasCarbonData = carbonRows.length > 0;
  const hasTradeData = tradeRows.some((r) => r.value != null);

  return (
    <div>
      {/* Tab toggle */}
      <div className="mb-4 flex justify-center gap-2">
        {hasCarbonData && (
          <button
            onClick={() => setTab('carbon')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              tab === 'carbon'
                ? 'bg-purple-600 text-white'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            탄소 가격 (Price|Carbon)
          </button>
        )}
        {hasTradeData && (
          <button
            onClick={() => setTab('trade')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              tab === 'trade'
                ? 'bg-purple-600 text-white'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            수출 무역 (Trade|Export)
          </button>
        )}
      </div>

      {tab === 'carbon' && hasCarbonData && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm font-medium text-slate-500">시나리오:</span>
            {availCarbon.map((s) => {
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
            지역: JPK (Japan + Korea 통합 모형 기준) &nbsp;|&nbsp; NetZero 시나리오에서 탄소 가격 급등
          </p>
          <ReactECharts option={carbonOption} style={{ height: 360 }} notMerge />
        </>
      )}

      {tab === 'trade' && (
        <>
          {hasTradeData ? (
            <>
              <p className="mb-2 text-center text-xs text-slate-400">
                한국(KOR) 총 수출액 &nbsp;|&nbsp; 실적: 2017~2024 (막대), 전망: 추후 업데이트 예정
              </p>
              <ReactECharts option={tradeOption} style={{ height: 360 }} notMerge />
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
              <span className="text-4xl">📦</span>
              <p className="text-sm">무역 전망 데이터 제출 대기 중</p>
              <p className="text-xs">(NetZero 시나리오 무역 데이터는 추후 업데이트)</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
