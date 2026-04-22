'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ForestRow } from '@/lib/forest/load';
import { REGION_LABELS, REGION_ORDER } from '@/lib/forest/meta';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: ForestRow[] }

type ScenarioMode = 'BAU' | 'NetZero' | 'compare';
type SubTab = 'chart' | 'gis';

const TARGET_YEARS = [2020, 2030, 2040, 2050];

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

function buildData(rows: ForestRow[], year: number, scenario: 'BAU' | 'NetZero' | 'Historical') {
  return REGION_ORDER.map((region) => {
    const label = REGION_LABELS[region] ?? region;
    let total = 0;
    const ages = AGE_CLASSES.map((ac) => {
      const row = rows.find(
        (r) => r.region === region && r.variable === ac.key && r.year === year && r.scenario === scenario,
      );
      const v = row?.value ?? 0;
      total += v;
      return v;
    });
    return { region, label, ages, total };
  }).filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
}

export function ForestAgeMapChart({ rows }: Props) {
  const [subTab,       setSubTab]       = useState<SubTab>('chart');
  const [selectedYear, setSelectedYear] = useState(2050);
  const [mode,         setMode]         = useState<ScenarioMode>('NetZero');

  const isHistorical = selectedYear <= 2020;

  /* ── SUB-TAB BAR ─────────────────────────────────────────── */
  const tabBar = (
    <div className="flex gap-1 border-b border-slate-200">
      {([['chart','📊 통계 차트'],['gis','🗺️ GIS 지도']] as [SubTab,string][]).map(([key, label]) => (
        <button key={key} onClick={() => setSubTab(key)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === key
              ? 'border-b-2 border-green-600 text-green-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}>
          {label}
        </button>
      ))}
    </div>
  );

  /* ── GIS TAB ─────────────────────────────────────────────── */
  if (subTab === 'gis') {
    return (
      <div className="space-y-4">
        {tabBar}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          ⚠️ 국가별 임령 분포 래스터 지도(GeoTIFF)는 별도 GIS 파이프라인으로 제공 예정입니다.
        </div>
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-green-200 bg-green-50">
          <span className="text-5xl">🗺️</span>
          <p className="text-base font-medium text-green-700">임령 분포 지도 (GeoTIFF)</p>
          <p className="max-w-sm text-center text-xs text-slate-500">
            국가별 래스터 지도는{' '}
            <code className="rounded bg-green-100 px-1">GeoTIFF_Outputs/</code> 디렉토리의 TIF 파일로 제공됩니다.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="mb-2 font-semibold text-slate-700">📁 데이터 파일</p>
          <p className="font-mono">{'{ISO3}'}_17Band_Historical.tif — 17개 밴드 실측 데이터</p>
          <p className="font-mono">{'{ISO3}'}_2050_Dashboard.tif &nbsp;— 국가별 2050년 전망</p>
          <p className="mt-3 text-slate-500">GIS 파이프라인 구축 후 인터랙티브 지도로 시각화 예정입니다.</p>
        </div>
      </div>
    );
  }

  /* ── CHART TAB ───────────────────────────────────────────── */
  const controls = (
    <div className="flex flex-wrap items-center gap-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">기준 연도</p>
        <div className="flex gap-1.5">
          {TARGET_YEARS.map((y) => (
            <button key={y} onClick={() => setSelectedYear(y)}
              className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors ${
                selectedYear === y ? 'bg-green-600 text-white' : 'border border-green-300 text-slate-600 hover:bg-green-50'
              }`}>
              {y}
            </button>
          ))}
        </div>
      </div>
      {!isHistorical && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-500">시나리오</p>
          <div className="flex gap-1.5">
            {MODE_BTNS.map(({ key, label, color }) => (
              <button key={key} onClick={() => setMode(key)}
                className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                  mode === key ? 'text-white shadow' : 'border text-slate-600 hover:bg-slate-50'
                }`}
                style={mode === key ? { backgroundColor: color } : { borderColor: color }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Compare mode
  if (!isHistorical && mode === 'compare') {
    const nzData  = buildData(rows, selectedYear, 'NetZero');
    const bauData = buildData(rows, selectedYear, 'BAU');
    const labels  = nzData.map((d) => d.label);
    const bauMap  = Object.fromEntries(bauData.map((d) => [d.label, d]));

    const compareSeries = AGE_CLASSES.flatMap((ac, idx) => [
      {
        name: `BAU · ${ac.label}`,
        type: 'bar', stack: 'BAU',
        data: labels.map((l) => bauMap[l]?.ages[idx] ?? 0),
        itemStyle: { color: ac.color, opacity: 0.55 },
        barMaxWidth: 22,
      },
      {
        name: `NZ · ${ac.label}`,
        type: 'bar', stack: 'NetZero',
        data: labels.map((l) => nzData.find((d) => d.label === l)?.ages[idx] ?? 0),
        itemStyle: { color: ac.color },
        barMaxWidth: 22,
      },
    ]);

    const legendData = AGE_CLASSES.flatMap((ac) => [`BAU · ${ac.label}`, `NZ · ${ac.label}`]);

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: { seriesName: string; value: number; name: string }[]) => {
          if (!params.length) return '';
          const bt = params.filter((p) => p.seriesName.startsWith('BAU')).reduce((s, p) => s + (p.value || 0), 0);
          const nt = params.filter((p) => p.seriesName.startsWith('NZ')).reduce((s, p) => s + (p.value || 0), 0);
          return `<div class="text-xs"><b>${params[0].name}</b><br/>BAU 합계: <b>${bt.toFixed(2)} Mha</b><br/>NetZero 합계: <b>${nt.toFixed(2)} Mha</b></div>`;
        },
      },
      legend: { bottom: 0, type: 'plain', data: legendData, textStyle: { fontSize: 9 }, itemWidth: 14 },
      grid: { left: 120, right: 20, top: 10, bottom: 110 },
      xAxis: { type: 'value', name: 'Million ha', nameLocation: 'end' },
      yAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10 } },
      series: compareSeries,
    };

    return (
      <div className="space-y-4">
        {tabBar}
        {controls}
        <div className="flex items-center gap-6 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2">
          <span className="text-xs font-semibold text-slate-500">막대 구분:</span>
          <span className="flex items-center gap-2 text-xs text-slate-700">
            <span className="inline-block h-3 w-5 rounded" style={{ background: '#16a34a' }} />NetZero (불투명)
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-700">
            <span className="inline-block h-3 w-5 rounded opacity-55" style={{ background: '#16a34a' }} />BAU (반투명)
          </span>
        </div>
        <ReactECharts option={option} style={{ height: 440 }} notMerge />
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
          <b>임령지도 (Forest Age Map):</b> BAU(반투명)와 NetZero(불투명) 영급구조 차이를 권역별로 비교합니다.
        </div>
      </div>
    );
  }

  // Single scenario
  const sc = isHistorical ? 'Historical' : (mode as 'BAU' | 'NetZero');
  const regionData = buildData(rows, selectedYear, sc);
  const yLabels    = regionData.map((d) => d.label);

  const singleOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number; name: string }[]) => {
        if (!params.length) return '';
        const total = params.reduce((s, p) => s + (p.value || 0), 0);
        const lines = params.filter((p) => p.value > 0).map((p) => {
          const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
          return `${p.seriesName}: <b>${p.value.toFixed(2)} Mha</b> (${pct}%)`;
        });
        return `<div class="text-xs"><b>${params[0].name}</b><br/>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { bottom: 0, type: 'plain', data: AGE_CLASSES.map((a) => a.label), textStyle: { fontSize: 10 }, itemWidth: 16 },
    grid: { left: 120, right: 20, top: 10, bottom: 65 },
    xAxis: { type: 'value', name: 'Million ha', nameLocation: 'end' },
    yAxis: { type: 'category', data: yLabels, axisLabel: { fontSize: 10 } },
    series: AGE_CLASSES.map((ac, idx) => ({
      name: ac.label,
      type: 'bar', stack: 'age',
      data: regionData.map((d) => d.ages[idx]),
      itemStyle: { color: ac.color },
      barMaxWidth: 28,
    })),
  };

  return (
    <div className="space-y-4">
      {tabBar}
      {controls}
      <ReactECharts option={singleOption} style={{ height: 420 }} notMerge />
      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>임령지도 (Forest Age Map):</b> 산림의 나이별 면적 분포. 61년생 이상(장령림)이 탄소저장 밀도가 높습니다.
      </div>
    </div>
  );
}
