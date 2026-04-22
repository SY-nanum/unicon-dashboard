'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ForestRow } from '@/lib/forest/load';
import { REGION_LABELS, REGION_ORDER } from '@/lib/forest/meta';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: ForestRow[] }

const SCENARIO_STYLE: Record<string, { color: string; lineType: 'solid' | 'dashed'; width: number }> = {
  Historical: { color: '#64748b', lineType: 'solid',  width: 3 },
  BAU:        { color: '#dc2626', lineType: 'dashed', width: 2 },
  NetZero:    { color: '#059669', lineType: 'dashed', width: 2 },
};

const REGION_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#06b6d4', '#84cc16', '#f59e0b', '#10b981',
  '#6366f1', '#94a3b8',
];

const DEFAULT_REGIONS = ['Republic of Korea', 'Japan', 'China', 'USA', 'Latin America'];

export function ForestAnnualFluxChart({ rows }: Props) {
  const availableRegions = REGION_ORDER.filter((r) =>
    rows.some((row) => row.region === r),
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>(DEFAULT_REGIONS);
  const [selectedScenarios, setSelectedScenarios] = useState<('Historical' | 'BAU' | 'NetZero')[]>(
    ['Historical', 'BAU', 'NetZero'],
  );

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  };
  const toggleScenario = (s: 'Historical' | 'BAU' | 'NetZero') => {
    setSelectedScenarios((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const allYears = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

  const series: object[] = [];
  selectedRegions.forEach((region) => {
    const color = REGION_COLORS[availableRegions.indexOf(region) % REGION_COLORS.length];
    const label = REGION_LABELS[region] ?? region;

    selectedScenarios.forEach((scenario) => {
      const st = SCENARIO_STYLE[scenario];
      const filtered = rows.filter((r) => r.region === region && r.scenario === scenario);
      if (!filtered.length) return;
      const dataMap = Object.fromEntries(filtered.map((r) => [r.year, r.value]));

      series.push({
        name: `${label} (${scenario === 'Historical' ? '실적' : scenario})`,
        type: 'line',
        data: allYears.map((y) => dataMap[y] ?? null),
        lineStyle: { color, width: st.width, type: st.lineType },
        itemStyle: { color },
        symbol: scenario === 'Historical' ? 'circle' : 'none',
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
        const year = params[0].axisValue;
        const lines = params
          .filter((p) => p.value != null)
          .map((p) => `${p.seriesName}: <b>${(p.value as number).toFixed(2)} Mt CO₂/yr</b>`);
        return `<div class="text-xs"><b>${year}년</b><br/>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 10 } },
    grid: { left: 85, right: 20, bottom: 60, top: 40 },
    xAxis: {
      type: 'category',
      data: allYears.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'Mt CO₂/yr',
      nameLocation: 'middle',
      nameGap: 65,
    },
    // Zero reference line
    markLine: { silent: true },
    series: [
      // Zero line as a reference
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
      ...series,
    ],
  };

  return (
    <div className="space-y-4">
      {/* Region selector */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">권역 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {availableRegions.map((r) => (
            <button
              key={r}
              onClick={() => toggleRegion(r)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                selectedRegions.includes(r)
                  ? 'bg-green-600 text-white'
                  : 'border border-green-300 text-slate-600 hover:bg-green-50'
              }`}
            >
              {REGION_LABELS[r] ?? r}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario selector */}
      <div className="flex gap-2">
        {(['Historical', 'BAU', 'NetZero'] as const).map((s) => {
          const st = SCENARIO_STYLE[s];
          return (
            <button
              key={s}
              onClick={() => toggleScenario(s)}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                selectedScenarios.includes(s) ? 'text-white' : 'border text-slate-500 hover:bg-slate-50'
              }`}
              style={selectedScenarios.includes(s) ? { backgroundColor: st.color } : { borderColor: st.color }}
            >
              {s === 'Historical' ? '실적' : s}
            </button>
          );
        })}
      </div>

      <ReactECharts option={option} style={{ height: 380 }} notMerge />

      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>연간 순흡수량 (Net Annual Flux):</b> 음수(−) = 탄소 흡수(Sink), 양수(+) = 탄소 방출(Source).
        산림이 흡수하는 CO₂량이 클수록 기후변화 완화 기여도가 높습니다.
        중남미·캐나다·러시아 등 대규모 산림국의 흡수량 변화에 주목하세요.
      </div>
    </div>
  );
}
