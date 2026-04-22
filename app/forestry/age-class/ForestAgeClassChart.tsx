'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ForestRow } from '@/lib/forest/load';
import { REGION_LABELS, REGION_ORDER } from '@/lib/forest/meta';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: ForestRow[] }

type ScenarioMode = 'BAU' | 'NetZero' | 'compare';

const AGE_CLASSES = [
  { key: 'Area|Forest|Age Class|0-20',  label: '0-20년생',    color: '#bbf7d0' },
  { key: 'Area|Forest|Age Class|21-40', label: '21-40년생',   color: '#4ade80' },
  { key: 'Area|Forest|Age Class|41-60', label: '41-60년생',   color: '#16a34a' },
  { key: 'Area|Forest|Age Class|61+',   label: '61년생 이상', color: '#14532d' },
];

export function ForestAgeClassChart({ rows }: Props) {
  const availableRegions = REGION_ORDER.filter((r) => rows.some((row) => row.region === r));
  const [selectedRegion, setSelectedRegion] = useState('Republic of Korea');
  const [mode, setMode] = useState<ScenarioMode>('BAU');

  // For single-scenario modes: use the selected scenario
  // For compare: show BAU and NetZero side by side (different stacks)
  const getRows = (scenario: 'BAU' | 'NetZero') =>
    rows.filter((r) => r.region === selectedRegion && r.scenario === scenario);

  const allYears = [...new Set(
    (mode === 'compare'
      ? [...getRows('BAU'), ...getRows('NetZero')]
      : getRows(mode as 'BAU' | 'NetZero')
    ).map((r) => r.year)
  )].sort((a, b) => a - b);

  // Build series
  let series: object[] = [];

  if (mode !== 'compare') {
    const filtered = getRows(mode as 'BAU' | 'NetZero');
    series = AGE_CLASSES.map((ac) => {
      const dataMap = Object.fromEntries(
        filtered.filter((r) => r.variable === ac.key).map((r) => [r.year, r.value]),
      );
      return {
        name: ac.label,
        type: 'bar',
        stack: 'age',
        data: allYears.map((y) => dataMap[y] ?? 0),
        itemStyle: { color: ac.color },
        barMaxWidth: 40,
      };
    });
  } else {
    // Compare mode: BAU stacked + NetZero stacked, side by side
    const bauRows = getRows('BAU');
    const nzRows  = getRows('NetZero');

    AGE_CLASSES.forEach((ac) => {
      const bauMap = Object.fromEntries(
        bauRows.filter((r) => r.variable === ac.key).map((r) => [r.year, r.value]),
      );
      const nzMap = Object.fromEntries(
        nzRows.filter((r) => r.variable === ac.key).map((r) => [r.year, r.value]),
      );
      series.push({
        name: `BAU · ${ac.label}`,
        type: 'bar',
        stack: 'BAU',
        data: allYears.map((y) => bauMap[y] ?? 0),
        itemStyle: { color: ac.color, opacity: 0.65 },
        barMaxWidth: 30,
      });
      series.push({
        name: `NetZero · ${ac.label}`,
        type: 'bar',
        stack: 'NetZero',
        data: allYears.map((y) => nzMap[y] ?? 0),
        itemStyle: { color: ac.color },
        barMaxWidth: 30,
      });
    });
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
        if (!params.length) return '';
        // Group by stack
        const bauItems  = params.filter((p) => p.seriesName.startsWith('BAU') || mode !== 'compare');
        const nzItems   = params.filter((p) => p.seriesName.startsWith('NetZero'));
        const bauTotal  = bauItems.reduce((s, p) => s + (p.value || 0), 0);
        const nzTotal   = nzItems.reduce((s, p) => s + (p.value || 0), 0);

        if (mode === 'compare') {
          return `<div class="text-xs"><b>${params[0].axisValue}년</b><br/>
            BAU 합계: <b>${bauTotal.toFixed(2)} Mha</b><br/>
            NetZero 합계: <b>${nzTotal.toFixed(2)} Mha</b></div>`;
        }
        const lines = params.filter((p) => p.value > 0)
          .map((p) => `${p.seriesName}: <b>${p.value.toFixed(2)} Mha</b>`);
        return `<div class="text-xs"><b>${params[0].axisValue}년</b><br/>${lines.join('<br/>')}<hr style="margin:4px 0"/>합계: <b>${bauTotal.toFixed(2)} Mha</b></div>`;
      },
    },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 10 } },
    grid: { left: 70, right: 20, bottom: 65, top: 20 },
    xAxis: { type: 'category', data: allYears.map(String), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: 'Million ha', nameLocation: 'middle', nameGap: 55 },
    series,
  };

  const MODE_BTNS: { key: ScenarioMode; label: string; color: string }[] = [
    { key: 'BAU',     label: 'BAU만',            color: '#dc2626' },
    { key: 'NetZero', label: 'NetZero만',         color: '#059669' },
    { key: 'compare', label: 'BAU + NetZero 비교', color: '#2563eb' },
  ];

  return (
    <div className="space-y-4">
      {/* Scenario mode */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {MODE_BTNS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                mode === key ? 'text-white shadow' : 'border text-slate-600 hover:bg-slate-50'
              }`}
              style={mode === key ? { backgroundColor: color } : { borderColor: color }}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === 'compare' && (
          <span className="text-xs text-slate-400">불투명 = NetZero &nbsp;|&nbsp; 반투명 = BAU</span>
        )}
      </div>

      {/* Region selector */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">권역 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {availableRegions.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                selectedRegion === r
                  ? 'bg-green-600 text-white'
                  : 'border border-green-300 text-slate-600 hover:bg-green-50'
              }`}
            >
              {REGION_LABELS[r] ?? r}
            </button>
          ))}
        </div>
      </div>

      <ReactECharts option={option} style={{ height: 380 }} notMerge />

      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>영급구조 (Age Class):</b> 산림의 수령별 면적 분포.
        비교 모드에서는 BAU(반투명)와 NetZero(불투명)를 연도별로 나란히 비교합니다.
      </div>
    </div>
  );
}
