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

const MODE_BTNS: { key: ScenarioMode; label: string; color: string }[] = [
  { key: 'BAU',     label: 'BAU만',             color: '#dc2626' },
  { key: 'NetZero', label: 'NetZero만',          color: '#059669' },
  { key: 'compare', label: 'BAU + NetZero 비교', color: '#2563eb' },
];

export function ForestAgeClassChart({ rows }: Props) {
  const availableRegions = REGION_ORDER.filter((r) => rows.some((row) => row.region === r));
  const [selectedRegion, setSelectedRegion] = useState('Republic of Korea');
  const [mode, setMode] = useState<ScenarioMode>('BAU');

  const getFiltered = (scenario: 'BAU' | 'NetZero') =>
    rows.filter((r) => r.region === selectedRegion && r.scenario === scenario);

  const years = [...new Set(
    (mode === 'compare'
      ? [...getFiltered('BAU'), ...getFiltered('NetZero')]
      : getFiltered(mode as 'BAU' | 'NetZero')
    ).map((r) => r.year)
  )].sort((a, b) => a - b);

  let series: object[];
  let legendData: string[];

  if (mode !== 'compare') {
    const filtered = getFiltered(mode as 'BAU' | 'NetZero');
    series = AGE_CLASSES.map((ac) => {
      const dataMap = Object.fromEntries(
        filtered.filter((r) => r.variable === ac.key).map((r) => [r.year, r.value]),
      );
      return {
        name: ac.label,
        type: 'bar',
        stack: 'age',
        data: years.map((y) => dataMap[y] ?? 0),
        itemStyle: { color: ac.color },
        barMaxWidth: 40,
      };
    });
    legendData = AGE_CLASSES.map((a) => a.label);
  } else {
    // Side-by-side stacked bars: BAU (semi-transparent) vs NetZero (solid)
    const bauRows = getFiltered('BAU');
    const nzRows  = getFiltered('NetZero');
    series = [];
    legendData = [];

    AGE_CLASSES.forEach((ac) => {
      const bauMap = Object.fromEntries(
        bauRows.filter((r) => r.variable === ac.key).map((r) => [r.year, r.value]),
      );
      const nzMap = Object.fromEntries(
        nzRows.filter((r) => r.variable === ac.key).map((r) => [r.year, r.value]),
      );
      series.push(
        {
          name: `BAU · ${ac.label}`,
          type: 'bar', stack: 'BAU',
          data: years.map((y) => bauMap[y] ?? 0),
          itemStyle: { color: ac.color, opacity: 0.55 },
          barMaxWidth: 28,
        },
        {
          name: `NZ · ${ac.label}`,
          type: 'bar', stack: 'NetZero',
          data: years.map((y) => nzMap[y] ?? 0),
          itemStyle: { color: ac.color },
          barMaxWidth: 28,
        },
      );
      legendData.push(`BAU · ${ac.label}`, `NZ · ${ac.label}`);
    });
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
        if (!params.length) return '';
        if (mode === 'compare') {
          const bau = params.filter((p) => p.seriesName.startsWith('BAU'));
          const nz  = params.filter((p) => p.seriesName.startsWith('NZ'));
          const bt  = bau.reduce((s, p) => s + (p.value || 0), 0);
          const nt  = nz.reduce((s, p)  => s + (p.value || 0), 0);
          return `<div class="text-xs"><b>${params[0].axisValue}년</b><br/>BAU 합계: <b>${bt.toFixed(2)} Mha</b><br/>NetZero 합계: <b>${nt.toFixed(2)} Mha</b></div>`;
        }
        const total = params.reduce((s, p) => s + (p.value || 0), 0);
        const lines = params.filter((p) => p.value > 0)
          .map((p) => `${p.seriesName}: <b>${p.value.toFixed(2)} Mha</b>`);
        return `<div class="text-xs"><b>${params[0].axisValue}년</b><br/>${lines.join('<br/>')}<hr style="margin:4px 0"/>합계: <b>${total.toFixed(2)} Mha</b></div>`;
      },
    },
    legend: {
      bottom: 0,
      type: 'plain',
      data: legendData,
      textStyle: { fontSize: 10 },
      itemWidth: 16,
    },
    grid: { left: 70, right: 20, bottom: mode === 'compare' ? 100 : 65, top: 20 },
    xAxis: { type: 'category', data: years.map(String), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: 'Million ha', nameLocation: 'middle', nameGap: 55 },
    series,
  };

  return (
    <div className="space-y-4">
      {/* Scenario mode */}
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
      </div>

      {/* Compare legend guide */}
      {mode === 'compare' && (
        <div className="flex items-center gap-6 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2">
          <span className="text-xs font-semibold text-slate-500">막대 구분:</span>
          <span className="flex items-center gap-2 text-xs text-slate-700">
            <span className="inline-block h-3 w-5 rounded" style={{ background: '#16a34a' }} />
            NetZero (불투명, 오른쪽)
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-700">
            <span className="inline-block h-3 w-5 rounded opacity-55" style={{ background: '#16a34a' }} />
            BAU (반투명, 왼쪽)
          </span>
        </div>
      )}

      {/* Region selector */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">권역 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {availableRegions.map((r) => (
            <button key={r} onClick={() => setSelectedRegion(r)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                selectedRegion === r
                  ? 'bg-green-600 text-white'
                  : 'border border-green-300 text-slate-600 hover:bg-green-50'
              }`}>
              {REGION_LABELS[r] ?? r}
            </button>
          ))}
        </div>
      </div>

      <ReactECharts option={option} style={{ height: 400 }} notMerge />

      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>영급구조 (Age Class):</b> 산림의 수령별 면적 분포.
        비교 모드에서는 BAU(왼쪽·반투명)와 NetZero(오른쪽·불투명)를 연도별로 나란히 비교합니다.
      </div>
    </div>
  );
}
