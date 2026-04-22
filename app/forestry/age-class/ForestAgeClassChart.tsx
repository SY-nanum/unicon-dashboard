'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ForestRow } from '@/lib/forest/load';
import { REGION_LABELS, REGION_ORDER } from '@/lib/forest/meta';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: ForestRow[] }
type ScenarioMode = 'BAU' | 'NetZero' | 'compare';

const AGE_CLASSES = [
  { key: 'Area|Forest|Age Class|0-20',  label: '0-20년생',    color: '#4ade80' },
  { key: 'Area|Forest|Age Class|21-40', label: '21-40년생',   color: '#16a34a' },
  { key: 'Area|Forest|Age Class|41-60', label: '41-60년생',   color: '#166534' },
  { key: 'Area|Forest|Age Class|61+',   label: '61년생 이상', color: '#052e16' },
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

  const getFiltered = (sc: 'BAU' | 'NetZero') =>
    rows.filter((r) => r.region === selectedRegion && r.scenario === sc);

  const years = [...new Set(
    (mode === 'compare'
      ? [...getFiltered('BAU'), ...getFiltered('NetZero')]
      : getFiltered(mode as 'BAU' | 'NetZero')
    ).map((r) => r.year)
  )].sort((a, b) => a - b);

  let series: object[];

  if (mode !== 'compare') {
    const filtered = getFiltered(mode as 'BAU' | 'NetZero');
    series = AGE_CLASSES.map((ac) => {
      const dataMap = Object.fromEntries(
        filtered.filter((r) => r.variable === ac.key).map((r) => [r.year, r.value]),
      );
      return { name: ac.label, type: 'bar', stack: 'age', barMaxWidth: 40,
        data: years.map((y) => dataMap[y] ?? 0), itemStyle: { color: ac.color } };
    });
  } else {
    const bauRows = getFiltered('BAU');
    const nzRows  = getFiltered('NetZero');
    series = AGE_CLASSES.flatMap((ac) => {
      const bauMap = Object.fromEntries(bauRows.filter((r) => r.variable === ac.key).map((r) => [r.year, r.value]));
      const nzMap  = Object.fromEntries(nzRows.filter((r) => r.variable === ac.key).map((r) => [r.year, r.value]));
      return [
        { name: `BAU::${ac.label}`, type: 'bar', stack: 'BAU', barMaxWidth: 28,
          data: years.map((y) => bauMap[y] ?? 0), itemStyle: { color: ac.color, opacity: 0.55 } },
        { name: `NZ::${ac.label}`, type: 'bar', stack: 'NetZero', barMaxWidth: 28,
          data: years.map((y) => nzMap[y] ?? 0), itemStyle: { color: ac.color } },
      ];
    });
  }

  const option = {
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
        if (!params.length) return '';
        if (mode === 'compare') {
          const bt = params.filter((p) => p.seriesName.startsWith('BAU')).reduce((s, p) => s + (p.value || 0), 0);
          const nt = params.filter((p) => p.seriesName.startsWith('NZ')).reduce((s, p) => s + (p.value || 0), 0);
          return `<div class="text-xs"><b>${params[0].axisValue}년</b><br/>BAU: <b>${bt.toFixed(2)} Mha</b><br/>NetZero: <b>${nt.toFixed(2)} Mha</b></div>`;
        }
        const total = params.reduce((s, p) => s + (p.value || 0), 0);
        const lines = params.filter((p) => p.value > 0).map((p) => `${p.seriesName}: <b>${p.value.toFixed(2)} Mha</b>`);
        return `<div class="text-xs"><b>${params[0].axisValue}년</b><br/>${lines.join('<br/>')}<hr style="margin:4px 0"/>합계: <b>${total.toFixed(2)} Mha</b></div>`;
      },
    },
    legend: { show: false },
    grid: { left: 70, right: 20, bottom: 20, top: 20 },
    xAxis: { type: 'category', data: years.map(String), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', name: 'Million ha', nameLocation: 'middle', nameGap: 55 },
    series,
  };

  // Custom 2-row legend
  const CustomLegend = () => {
    if (mode === 'compare') {
      return (
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          {/* BAU row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#dc2626' }}>BAU</span>
            {AGE_CLASSES.map((ac) => (
              <span key={ac.key} className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="inline-block h-3 w-5 flex-shrink-0 rounded opacity-55" style={{ background: ac.color }}/>
                {ac.label}
              </span>
            ))}
          </div>
          {/* NetZero row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#059669' }}>NetZero</span>
            {AGE_CLASSES.map((ac) => (
              <span key={ac.key} className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="inline-block h-3 w-5 flex-shrink-0 rounded" style={{ background: ac.color }}/>
                {ac.label}
              </span>
            ))}
          </div>
        </div>
      );
    }
    const scColor = mode === 'BAU' ? '#dc2626' : '#059669';
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2">
        <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: scColor }}>{mode}</span>
        {AGE_CLASSES.map((ac) => (
          <span key={ac.key} className="flex items-center gap-1.5 text-xs text-slate-700">
            <span className="inline-block h-3 w-5 flex-shrink-0 rounded" style={{ background: ac.color }}/>
            {ac.label}
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
      </div>

      <div className="flex flex-wrap gap-1.5">
        {availableRegions.map((r) => (
          <button key={r} onClick={() => setSelectedRegion(r)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              selectedRegion === r ? 'bg-green-600 text-white' : 'border border-green-300 text-slate-600 hover:bg-green-50'
            }`}>
            {REGION_LABELS[r] ?? r}
          </button>
        ))}
      </div>

      <ReactECharts option={option} style={{ height: 380 }} notMerge />
      <CustomLegend />

      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>영급구조 (Age Class):</b> 산림의 수령별 면적 분포.
        비교 모드: BAU(반투명·왼쪽)와 NetZero(불투명·오른쪽)를 연도별로 나란히 비교합니다.
      </div>
    </div>
  );
}
