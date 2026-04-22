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
const SC_COLOR = { BAU: '#dc2626', NetZero: '#059669', Historical: '#64748b' };

const MODE_BTNS: { key: ScenarioMode; label: string; color: string }[] = [
  { key: 'BAU',     label: 'BAU만',             color: '#dc2626' },
  { key: 'NetZero', label: 'NetZero만',          color: '#059669' },
  { key: 'compare', label: 'BAU + NetZero 비교', color: '#2563eb' },
];

function getRegionData(rows: ForestRow[], year: number, scenario: 'BAU' | 'NetZero' | 'Historical') {
  return REGION_ORDER.map((region) => {
    const row = rows.find((r) => r.region === region && r.year === year && r.scenario === scenario);
    return { region, label: REGION_LABELS[region] ?? region, value: row?.value ?? 0 };
  }).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}

export function ForestBiomassChart({ rows }: Props) {
  const [subTab,       setSubTab]       = useState<SubTab>('chart');
  const [selectedYear, setSelectedYear] = useState(2050);
  const [mode,         setMode]         = useState<ScenarioMode>('NetZero');

  const isHistorical = selectedYear <= 2020;

  /* ── TAB BAR ─────────────────────────────────────────────── */
  const tabBar = (
    <div className="flex gap-1 border-b border-slate-200">
      {([['chart', '📊 통계 차트'], ['gis', '🗺️ GIS 지도']] as [SubTab, string][]).map(([key, label]) => (
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

  /* ── CONTROLS ─────────────────────────────────────────────── */
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

  /* ── CHART CONTENT ───────────────────────────────────────── */
  let chartContent: React.ReactNode;

  if (!isHistorical && mode === 'compare') {
    const bauData = getRegionData(rows, selectedYear, 'BAU');
    const nzData  = getRegionData(rows, selectedYear, 'NetZero');
    const labels  = nzData.map((d) => d.label);
    const bauMap  = Object.fromEntries(bauData.map((d) => [d.label, d.value]));

    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { show: false },
      grid: { left: 130, right: 80, top: 10, bottom: 30 },
      xAxis: { type: 'value', name: 'Mt C', nameLocation: 'end' },
      yAxis: { type: 'category', data: labels, axisLabel: { fontSize: 11 } },
      series: [
        {
          name: 'BAU',
          type: 'bar',
          data: labels.map((l) => ({ value: bauMap[l] ?? 0, itemStyle: { color: SC_COLOR.BAU, opacity: 0.65 } })),
          label: { show: true, position: 'right', formatter: (p: { value: number }) => `${p.value.toFixed(0)}`, fontSize: 10 },
          barMaxWidth: 22,
        },
        {
          name: 'NetZero',
          type: 'bar',
          data: labels.map((l) => ({
            value: nzData.find((d) => d.label === l)?.value ?? 0,
            itemStyle: { color: SC_COLOR.NetZero },
          })),
          label: { show: true, position: 'right', formatter: (p: { value: number }) => `${p.value.toFixed(0)}`, fontSize: 10 },
          barMaxWidth: 22,
        },
      ],
    };

    chartContent = (
      <>
        {controls}
        <ReactECharts option={option} style={{ height: 440 }} notMerge />
        {/* Custom 2-row legend */}
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#dc2626' }}>BAU</span>
            <span className="inline-block h-3 w-5 flex-shrink-0 rounded opacity-65" style={{ background: '#dc2626' }}/>
            <span className="text-xs text-slate-600">BAU 시나리오 탄소저장량 (반투명)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#059669' }}>NetZero</span>
            <span className="inline-block h-3 w-5 flex-shrink-0 rounded" style={{ background: '#059669' }}/>
            <span className="text-xs text-slate-600">NetZero 시나리오 탄소저장량</span>
          </div>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
          <b>산림 탄소저장량 (바이오매스 대리 지표):</b> BAU 대비 NetZero 시나리오의 권역별 탄소저장 차이를 비교합니다.
        </div>
      </>
    );
  } else {
    const sc = isHistorical ? 'Historical' : (mode as 'BAU' | 'NetZero');
    const yearData = getRegionData(rows, selectedYear, sc);

    const singleOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: { value: number; name: string }[]) =>
          params.length ? `<b>${params[0].name}</b><br/>탄소저장량: <b>${params[0].value.toFixed(1)} Mt C</b>` : '',
      },
      legend: { show: false },
      grid: { left: 130, right: 70, top: 10, bottom: 30 },
      xAxis: { type: 'value', name: 'Mt C', nameLocation: 'end' },
      yAxis: { type: 'category', data: yearData.map((d) => d.label), axisLabel: { fontSize: 11 } },
      series: [{
        type: 'bar',
        data: yearData.map((d) => ({ value: d.value, itemStyle: { color: SC_COLOR[sc] } })),
        label: { show: true, position: 'right', formatter: (p: { value: number }) => `${p.value.toFixed(0)}`, fontSize: 10 },
        barMaxWidth: 30,
      }],
    };

    chartContent = (
      <>
        {controls}
        <ReactECharts option={singleOption} style={{ height: 420 }} notMerge />
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
          <b>산림 탄소저장량 (바이오매스 대리 지표):</b> 산림 생물체에 저장된 탄소의 총량.
          중남미·러시아·캐나다 등 대규모 산림 권역이 글로벌 탄소저장고 역할을 담당합니다.
        </div>
      </>
    );
  }

  /* ── GIS CONTENT ─────────────────────────────────────────── */
  const gisContent = (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
        ⚠️ 공간 바이오매스 지도 데이터(GeoTIFF)는 국가별 래스터 파일로 제공되며,
        현재 GIS 렌더링 파이프라인(geotiff.js + MapLibre GL) 구축 전입니다.
      </div>
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-green-200 bg-green-50">
        <span className="text-5xl">🗺️</span>
        <p className="text-base font-medium text-green-700">바이오매스 분포 지도 (GeoTIFF)</p>
        <p className="max-w-sm text-center text-xs text-slate-500">
          국가별 래스터 지도는{' '}
          <code className="rounded bg-green-100 px-1">GeoTIFF_Outputs/</code> 디렉토리의 TIF 파일로 제공됩니다.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="mb-2 font-semibold text-slate-700">📁 데이터 파일</p>
        <p className="font-mono">{'{ISO3}'}_2050_Dashboard.tif &nbsp;— 국가별 2050년 전망 (150+ 국가)</p>
        <p className="font-mono">{'{ISO3}'}_17Band_Historical.tif — 17개 밴드 실측 데이터</p>
        <p className="mt-3 text-slate-500">GIS 파이프라인 구축 후 인터랙티브 지도로 시각화 예정입니다.</p>
      </div>
    </>
  );

  /* ── SINGLE RETURN ───────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {tabBar}
      {subTab === 'chart' ? chartContent : gisContent}
    </div>
  );
}
