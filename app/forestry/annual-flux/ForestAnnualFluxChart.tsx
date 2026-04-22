'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ForestRow } from '@/lib/forest/load';
import { REGION_LABELS, REGION_ORDER } from '@/lib/forest/meta';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: ForestRow[] }

type ScenarioMode = 'BAU' | 'NetZero' | 'compare';

const SCENARIO_LINE = {
  Historical: { type: 'solid'  as const, width: 2,   symbol: 'circle' as const },
  BAU:        { type: 'dashed' as const, width: 2,   symbol: 'none'   as const },
  NetZero:    { type: 'solid'  as const, width: 2.5, symbol: 'none'   as const },
};

const REGION_COLORS = [
  '#ef4444','#f97316','#eab308','#22c55e',
  '#14b8a6','#3b82f6','#8b5cf6','#ec4899',
  '#06b6d4','#84cc16','#f59e0b','#10b981','#6366f1','#94a3b8',
];

const DEFAULT_REGIONS = ['Republic of Korea', 'Japan', 'China', 'USA', 'Latin America'];

const MODE_BTNS: { key: ScenarioMode; label: string; color: string }[] = [
  { key: 'BAU',     label: 'BAU만',             color: '#dc2626' },
  { key: 'NetZero', label: 'NetZero만',          color: '#059669' },
  { key: 'compare', label: 'BAU + NetZero 비교', color: '#2563eb' },
];

export function ForestAnnualFluxChart({ rows }: Props) {
  const availableRegions = REGION_ORDER.filter((r) => rows.some((row) => row.region === r));
  const [selectedRegions, setSelectedRegions] = useState<string[]>(DEFAULT_REGIONS);
  const [mode, setMode] = useState<ScenarioMode>('compare');
  const [showHistorical, setShowHistorical] = useState(false);

  const toggleRegion = (r: string) =>
    setSelectedRegions((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);

  const allYears = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

  const activeScenarios: ('Historical' | 'BAU' | 'NetZero')[] = [
    ...(showHistorical ? ['Historical' as const] : []),
    ...(mode === 'BAU'     ? ['BAU'     as const] : []),
    ...(mode === 'NetZero' ? ['NetZero' as const] : []),
    ...(mode === 'compare' ? ['BAU' as const, 'NetZero' as const] : []),
  ];

  const series: object[] = [
    {
      name: '__zero__',
      type: 'line',
      data: allYears.map(() => 0),
      lineStyle: { color: '#94a3b8', width: 1, type: 'dotted' },
      itemStyle: { opacity: 0 },
      symbol: 'none',
      legendHoverLink: false,
      silent: true,
      tooltip: { show: false },
    },
  ];

  selectedRegions.forEach((region) => {
    const color = REGION_COLORS[availableRegions.indexOf(region) % REGION_COLORS.length];
    const label = REGION_LABELS[region] ?? region;

    activeScenarios.forEach((scenario) => {
      const st = SCENARIO_LINE[scenario];
      const filtered = rows.filter((r) => r.region === region && r.scenario === scenario);
      if (!filtered.length) return;
      const dataMap = Object.fromEntries(filtered.map((r) => [r.year, r.value]));

      const lineColor = scenario === 'Historical' ? '#64748b' : color;
      const suffix = scenario === 'Historical' ? ' (실적)' : mode === 'compare' ? ` · ${scenario}` : '';

      series.push({
        name: `${label}${suffix}`,
        type: 'line',
        data: allYears.map((y) => dataMap[y] ?? null),
        lineStyle: { color: lineColor, width: st.width, type: st.type },
        itemStyle: { color: lineColor },
        symbol: st.symbol,
        symbolSize: 5,
        connectNulls: false,
      });
    });
  });

  const legendBottom = mode === 'compare' && selectedRegions.length > 5 ? 100 : 65;

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { seriesName: string; value: number | null; axisValue: string }[]) => {
        if (!params.length) return '';
        const lines = params
          .filter((p) => p.value != null && p.seriesName !== '__zero__')
          .map((p) => `${p.seriesName}: <b>${(p.value as number).toFixed(2)} Mt CO₂/yr</b>`);
        return `<div class="text-xs"><b>${params[0].axisValue}년</b><br/>${lines.join('<br/>')}</div>`;
      },
    },
    legend: {
      bottom: 0,
      type: 'plain',
      textStyle: { fontSize: 10 },
      itemWidth: 20,
      formatter: (name: string) => name === '__zero__' ? '' : name,
    },
    grid: { left: 85, right: 20, bottom: legendBottom, top: 30 },
    xAxis: { type: 'category', data: allYears.map(String), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: 'Mt CO₂/yr', nameLocation: 'middle', nameGap: 65 },
    series,
  };

  return (
    <div className="space-y-4">
      {/* Scenario mode buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {MODE_BTNS.map(({ key, label, color }) => (
          <button key={key} onClick={() => setMode(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              mode === key ? 'text-white shadow' : 'border text-slate-600 hover:bg-slate-50'
            }`}
            style={mode === key ? { backgroundColor: color } : { borderColor: color }}>
            {label}
          </button>
        ))}
        <button onClick={() => setShowHistorical((v) => !v)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            showHistorical ? 'bg-slate-500 text-white' : 'border border-slate-400 text-slate-500 hover:bg-slate-50'
          }`}>
          실적 {showHistorical ? '포함' : '숨김'}
        </button>
      </div>

      {/* Compare legend guide */}
      {mode === 'compare' && (
        <div className="flex items-center gap-6 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2">
          <span className="text-xs font-semibold text-slate-500">선 구분:</span>
          <span className="flex items-center gap-2 text-xs text-slate-700">
            <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#059669" strokeWidth="2.5"/></svg>
            NetZero (실선)
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-700">
            <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#dc2626" strokeWidth="2" strokeDasharray="5,3"/></svg>
            BAU (점선)
          </span>
          <span className="text-xs text-slate-400">색상 = 권역</span>
        </div>
      )}

      {/* Region selector */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">권역 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {availableRegions.map((r) => (
            <button key={r} onClick={() => toggleRegion(r)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                selectedRegions.includes(r)
                  ? 'bg-green-600 text-white'
                  : 'border border-green-300 text-slate-600 hover:bg-green-50'
              }`}>
              {REGION_LABELS[r] ?? r}
            </button>
          ))}
        </div>
      </div>

      <ReactECharts option={option} style={{ height: 420 }} notMerge />

      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>연간 순흡수량 (Net Annual Flux):</b> 음수(−) = 탄소 흡수(Sink), 양수(+) = 탄소 방출(Source).
        산림이 흡수하는 CO₂량이 클수록 기후변화 완화 기여도가 높습니다.
      </div>
    </div>
  );
}
