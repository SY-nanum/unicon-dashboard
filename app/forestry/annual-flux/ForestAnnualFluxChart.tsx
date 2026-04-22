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
  const [showHistorical, setShowHistorical] = useState(true);

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
      series.push({
        name: `${scenario}::${label}`,
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

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { seriesName: string; value: number | null; axisValue: string }[]) => {
        if (!params.length) return '';
        const lines = params.filter((p) => p.value != null && !p.seriesName.startsWith('__')).map((p) => {
          const [sc, region] = p.seriesName.split('::');
          const scLabel = sc === 'Historical' ? '실적' : sc;
          return `${region} (${scLabel}): <b>${(p.value as number).toFixed(2)} Mt CO₂/yr</b>`;
        });
        return `<div class="text-xs"><b>${params[0].axisValue}년</b><br/>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { show: false },
    grid: { left: 85, right: 20, bottom: 20, top: 30 },
    xAxis: { type: 'category', data: allYears.map(String), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: 'Mt CO₂/yr', nameLocation: 'middle', nameGap: 65 },
    series,
  };

  const regionColor = (r: string) => REGION_COLORS[availableRegions.indexOf(r) % REGION_COLORS.length];

  const CustomLegend = () => {
    if (mode === 'compare') {
      return (
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#dc2626' }}>BAU</span>
            {selectedRegions.map((r) => (
              <span key={r} className="flex items-center gap-1.5 text-xs text-slate-700">
                <svg width="22" height="8" className="flex-shrink-0">
                  <line x1="0" y1="4" x2="22" y2="4" stroke={regionColor(r)} strokeWidth="2" strokeDasharray="5,3"/>
                </svg>
                {REGION_LABELS[r] ?? r}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#059669' }}>NetZero</span>
            {selectedRegions.map((r) => (
              <span key={r} className="flex items-center gap-1.5 text-xs text-slate-700">
                <svg width="22" height="8" className="flex-shrink-0">
                  <line x1="0" y1="4" x2="22" y2="4" stroke={regionColor(r)} strokeWidth="2.5"/>
                </svg>
                {REGION_LABELS[r] ?? r}
              </span>
            ))}
          </div>
          {showHistorical && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
              <span className="w-16 flex-shrink-0 font-bold">실적</span>
              <svg width="22" height="8" className="flex-shrink-0"><line x1="0" y1="4" x2="22" y2="4" stroke="#64748b" strokeWidth="2"/><circle cx="11" cy="4" r="2.5" fill="#64748b"/></svg>
              <span>실측값 — 권역 구분 없이 회색 단일 계열로 표시 (데이터가 있는 권역만)</span>
            </div>
          )}
        </div>
      );
    }
    const lineStyle = mode === 'BAU' ? '5,3' : undefined;
    const scColor   = mode === 'BAU' ? '#dc2626' : '#059669';
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2">
        <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: scColor }}>{mode}</span>
        {showHistorical && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#64748b" strokeWidth="2"/><circle cx="11" cy="4" r="2.5" fill="#64748b"/></svg>
            실적 (회색 단일 계열)
          </span>
        )}
        {selectedRegions.map((r) => (
          <span key={r} className="flex items-center gap-1.5 text-xs text-slate-700">
            <svg width="22" height="8" className="flex-shrink-0">
              <line x1="0" y1="4" x2="22" y2="4" stroke={regionColor(r)} strokeWidth="2" strokeDasharray={lineStyle}/>
            </svg>
            {REGION_LABELS[r] ?? r}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
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

      <div className="flex flex-wrap gap-1.5">
        {availableRegions.map((r) => (
          <button key={r} onClick={() => toggleRegion(r)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              selectedRegions.includes(r) ? 'text-white' : 'border border-green-300 text-slate-600 hover:bg-green-50'
            }`}
            style={selectedRegions.includes(r) ? { backgroundColor: regionColor(r) } : {}}>
            {REGION_LABELS[r] ?? r}
          </button>
        ))}
      </div>

      <ReactECharts option={option} style={{ height: 360 }} notMerge />
      <CustomLegend />

      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800 space-y-1">
        <p><b>연간 순흡수량 (Net Annual Flux):</b> 음수(−) = 탄소 흡수(Sink), 양수(+) = 탄소 방출(Source).</p>
        <p className="text-slate-500">
          <b>회색 실선 (실적):</b> IAMC 실측 데이터가 존재하는 권역의 과거 실적값입니다.
          시나리오 색상 구분 없이 <span className="font-semibold text-slate-600">회색 단일 계열</span>로 표시되며,
          선택된 권역 중 실측 데이터가 있는 경우에만 나타납니다.
        </p>
      </div>
    </div>
  );
}
