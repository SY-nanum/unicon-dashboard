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
const SCENARIO_COLOR = { BAU: '#dc2626', NetZero: '#059669', Historical: '#64748b' };

export function ForestBiomassChart({ rows }: Props) {
  const [subTab, setSubTab]  = useState<SubTab>('chart');
  const [selectedYear, setSelectedYear] = useState(2050);
  const [mode, setMode] = useState<ScenarioMode>('NetZero');

  const effectiveScenario = selectedYear <= 2020 ? 'Historical' : undefined;

  // Build chart data
  function getYearData(scenario: 'BAU' | 'NetZero' | 'Historical') {
    return REGION_ORDER.map((region) => {
      const row = rows.find(
        (r) => r.region === region && r.year === selectedYear && r.scenario === scenario,
      );
      return { region, label: REGION_LABELS[region] ?? region, value: row?.value ?? 0 };
    }).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  }

  const isHistorical = selectedYear <= 2020;
  const scenario = isHistorical ? 'Historical' : (mode !== 'compare' ? mode : 'NetZero');

  let series: object[];

  if (!isHistorical && mode === 'compare') {
    const bauData = getYearData('BAU');
    const nzData  = getYearData('NetZero');
    // Merge regions in consistent order (by NetZero value)
    const regions = nzData.map((d) => d.label);
    series = [
      {
        name: 'BAU',
        type: 'bar',
        data: regions.map((lbl) => ({
          value: bauData.find((d) => d.label === lbl)?.value ?? 0,
          itemStyle: { color: SCENARIO_COLOR.BAU, opacity: 0.6 },
        })),
        label: { show: true, position: 'right', formatter: (p: { value: number }) => `${p.value.toFixed(0)}`, fontSize: 9 },
        barMaxWidth: 18,
      },
      {
        name: 'NetZero',
        type: 'bar',
        data: regions.map((lbl) => ({
          value: nzData.find((d) => d.label === lbl)?.value ?? 0,
          itemStyle: { color: SCENARIO_COLOR.NetZero },
        })),
        label: { show: true, position: 'right', formatter: (p: { value: number }) => `${p.value.toFixed(0)}`, fontSize: 9 },
        barMaxWidth: 18,
      },
    ];

    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, data: ['BAU', 'NetZero'] },
      grid: { left: 120, right: 80, top: 30, bottom: 20 },
      xAxis: { type: 'value', name: 'Mt C', nameLocation: 'end' },
      yAxis: { type: 'category', data: regions, axisLabel: { fontSize: 11 } },
      series,
    };

    return <BiomassShell
      subTab={subTab} setSubTab={setSubTab}
      selectedYear={selectedYear} setSelectedYear={setSelectedYear}
      mode={mode} setMode={setMode} isHistorical={false}
    >
      <ReactECharts option={option} style={{ height: 420 }} notMerge />
    </BiomassShell>;
  }

  // Single scenario
  const yearData = getYearData(isHistorical ? 'Historical' : (mode as 'BAU' | 'NetZero'));
  const singleOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { value: number; name: string }[]) => {
        if (!params.length) return '';
        return `<b>${params[0].name}</b><br/>탄소저장량: <b>${params[0].value.toFixed(1)} Mt C</b>`;
      },
    },
    grid: { left: 120, right: 70, top: 10, bottom: 30 },
    xAxis: { type: 'value', name: 'Mt C', nameLocation: 'end' },
    yAxis: { type: 'category', data: yearData.map((d) => d.label), axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: yearData.map((d) => ({
        value: d.value,
        itemStyle: { color: SCENARIO_COLOR[isHistorical ? 'Historical' : mode as keyof typeof SCENARIO_COLOR] },
      })),
      label: { show: true, position: 'right', formatter: (p: { value: number }) => `${p.value.toFixed(0)}`, fontSize: 10 },
      barMaxWidth: 30,
    }],
  };

  return <BiomassShell
    subTab={subTab} setSubTab={setSubTab}
    selectedYear={selectedYear} setSelectedYear={setSelectedYear}
    mode={mode} setMode={setMode} isHistorical={isHistorical}
  >
    <ReactECharts option={singleOption} style={{ height: 400 }} notMerge />
  </BiomassShell>;
}

/* ── Shell component (tabs + controls + children) ── */
function BiomassShell({
  subTab, setSubTab,
  selectedYear, setSelectedYear,
  mode, setMode,
  isHistorical,
  children,
}: {
  subTab: SubTab; setSubTab: (t: SubTab) => void;
  selectedYear: number; setSelectedYear: (y: number) => void;
  mode: ScenarioMode; setMode: (m: ScenarioMode) => void;
  isHistorical: boolean;
  children: React.ReactNode;
}) {
  const MODE_BTNS: { key: ScenarioMode; label: string; color: string }[] = [
    { key: 'BAU',     label: 'BAU만',            color: '#dc2626' },
    { key: 'NetZero', label: 'NetZero만',         color: '#059669' },
    { key: 'compare', label: 'BAU + NetZero 비교', color: '#2563eb' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setSubTab('chart')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === 'chart'
              ? 'border-b-2 border-green-600 text-green-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          📊 통계 차트
        </button>
        <button
          onClick={() => setSubTab('gis')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === 'gis'
              ? 'border-b-2 border-green-600 text-green-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          🗺️ GIS 지도
        </button>
      </div>

      {subTab === 'chart' ? (
        <>
          <div className="flex flex-wrap items-center gap-4">
            {/* Year */}
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
            {/* Scenario mode */}
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
          {children}
          <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
            <b>산림 탄소저장량 (바이오매스 대리 지표):</b> 산림 생물체에 저장된 탄소의 총량.
            비교 모드에서 BAU 대비 NetZero 시나리오의 탄소저장 차이를 확인할 수 있습니다.
          </div>
        </>
      ) : (
        <GisPlaceholder type="biomass" />
      )}
    </div>
  );
}

function GisPlaceholder({ type }: { type: 'biomass' | 'age' }) {
  const title   = type === 'biomass' ? '바이오매스 분포 지도' : '임령 분포 지도';
  const tifNote = type === 'biomass'
    ? '{ISO3}_2050_Dashboard.tif (150+ 국가)'
    : '{ISO3}_17Band_Historical.tif (17개 밴드)';

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
        ⚠️ GeoTIFF 래스터 파일로 제공되며, 현재 GIS 렌더링 파이프라인(geotiff.js + MapLibre GL) 구축 전입니다.
      </div>
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-green-200 bg-green-50">
        <span className="text-5xl">🗺️</span>
        <p className="text-base font-medium text-green-700">{title} (GeoTIFF)</p>
        <p className="max-w-sm text-center text-xs text-slate-500">
          국가별 래스터 지도는 <code className="rounded bg-green-100 px-1">GeoTIFF_Outputs/</code> 디렉토리의 TIF 파일로 제공됩니다.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="mb-2 font-semibold text-slate-700">📁 데이터 파일</p>
        <p className="font-mono">{tifNote}</p>
        <p className="mt-3 text-slate-500">
          GIS 파이프라인 구축 후 국가별 인터랙티브 지도로 시각화 예정입니다.
        </p>
      </div>
    </div>
  );
}
