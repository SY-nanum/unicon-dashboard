'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
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

const REGION_CENTROIDS: Record<string, [number, number]> = {
  'Republic of Korea':                            [ 127.5,  37.5 ],
  'Japan':                                        [ 138.3,  36.2 ],
  'China':                                        [ 104.2,  35.9 ],
  'ASEAN':                                        [ 110.0,   5.0 ],
  'India':                                        [  78.7,  20.9 ],
  'USA':                                          [ -95.7,  37.1 ],
  'Canada':                                       [ -96.8,  60.0 ],
  'Latin America':                                [ -55.0, -15.0 ],
  'European Union & United Kingdom':              [  10.0,  50.0 ],
  'Russia and Neighboring Transition Countries':  [ 100.0,  61.5 ],
  'Oceania':                                      [ 133.0, -25.0 ],
  'Sub-Saharan Africa':                           [  25.0, -10.0 ],
  'Middle East & North Africa':                   [  35.0,  28.0 ],
  'ROW':                                          [   0.0,  20.0 ],
};

interface GisPoint { region: string; label: string; value: number; lng: number; lat: number }

/* ── World Map Component ─────────────────────────────────────
   single mode : data[]  (one colored bubble set)
   compare mode: bauData[] + nzData[]  (red BAU + green NZ bubbles)
─────────────────────────────────────────────────────────────── */
function GisWorldMap({
  data, bauData, nzData, compare = false, unit, title,
}: {
  data?: GisPoint[];
  bauData?: GisPoint[];
  nzData?: GisPoint[];
  compare?: boolean;
  unit: string;
  title: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const depKey = compare
    ? JSON.stringify([...(bauData ?? []), ...(nzData ?? [])].map((d) => [d.region, d.value]))
    : JSON.stringify((data ?? []).map((d) => [d.region, d.value]));

  useEffect(() => {
    let disposed = false;
    async function init() {
      try {
        const echarts = await import('echarts');
        const res = await fetch('/geo/world.json');
        if (!res.ok) throw new Error('fetch failed');
        const worldJson = await res.json();
        echarts.registerMap('world', worldJson as Parameters<typeof echarts.registerMap>[1]);
        if (disposed || !divRef.current) return;

        const chart = echarts.init(divRef.current);

        const allPoints = compare
          ? [...(bauData ?? []), ...(nzData ?? [])]
          : (data ?? []);
        const maxVal = Math.max(...allPoints.map((d) => d.value), 1);

        // Build BAU+NZ lookup for compare tooltip
        const bauMap = Object.fromEntries((bauData ?? []).map((d) => [d.region, d.value]));
        const nzMap  = Object.fromEntries((nzData  ?? []).map((d) => [d.region, d.value]));

        type ScatterItem = {
          name: string; label: string; value: [number, number, number];
          bauVal?: number; nzVal?: number;
        };

        const buildSeries = (
          pts: GisPoint[],
          color: string,
          opacity: number,
          seriesName: string,
          showLabel: boolean,
        ) => ({
          name: seriesName,
          type: 'scatter',
          coordinateSystem: 'geo',
          data: pts.filter((d) => d.value > 0).map((d): ScatterItem => ({
            name: d.region, label: d.label,
            value: [d.lng, d.lat, d.value],
            bauVal: bauMap[d.region],
            nzVal:  nzMap[d.region],
          })),
          symbolSize: (val: number[]) => Math.max(8, Math.sqrt(val[2] / maxVal) * 56),
          itemStyle: { color, opacity, borderColor: '#064e3b', borderWidth: 1 },
          label: showLabel ? {
            show: true,
            formatter: (p: { data?: ScatterItem }) => p.data?.label ?? '',
            position: 'top', fontSize: 9, color: '#1e293b',
          } : { show: false },
          emphasis: { scale: true },
        });

        const series = compare
          ? [
              buildSeries(bauData ?? [], '#dc2626', 0.55, 'BAU', false),
              buildSeries(nzData  ?? [], '#059669', 0.82, 'NetZero', true),
            ]
          : [buildSeries(data ?? [], '#059669', 0.75, 'Value', true)];

        chart.setOption({
          backgroundColor: '#f0fdf4',
          title: { text: title, left: 'center', top: 8, textStyle: { fontSize: 12, color: '#374151' } },
          tooltip: {
            trigger: 'item',
            formatter: (p: { data?: ScatterItem }) => {
              if (!p.data) return '';
              if (compare) {
                const bv = (p.data.bauVal ?? 0).toFixed(1);
                const nv = (p.data.nzVal  ?? 0).toFixed(1);
                return `<b>${p.data.label}</b><br/>BAU: <b>${bv} ${unit}</b><br/>NetZero: <b>${nv} ${unit}</b>`;
              }
              return `<b>${p.data.label}</b><br/>${p.data.value[2].toFixed(1)} ${unit}`;
            },
          },
          legend: compare
            ? { bottom: 8, data: ['BAU', 'NetZero'], textStyle: { fontSize: 11 } }
            : { show: false },
          geo: {
            map: 'world', roam: true, top: 40,
            itemStyle: { areaColor: '#dcfce7', borderColor: '#86efac', borderWidth: 0.5 },
            emphasis: { itemStyle: { areaColor: '#bbf7d0' }, label: { show: false } },
          },
          series,
        });

        if (!disposed) setStatus('ready');
      } catch { if (!disposed) setStatus('error'); }
    }
    init();
    return () => { disposed = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, compare, unit]);

  if (status === 'error') {
    return (
      <div className="flex h-60 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
        ⚠️ 지도 데이터를 불러오지 못했습니다.
      </div>
    );
  }
  return (
    <div className="relative rounded-lg border border-green-100 overflow-hidden">
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm text-slate-400">
          🗺️ 세계 지도 로딩 중…
        </div>
      )}
      <div ref={divRef} style={{ height: compare ? 450 : 420, width: '100%' }} />
    </div>
  );
}

function getRegionData(rows: ForestRow[], year: number, scenario: 'BAU' | 'NetZero' | 'Historical') {
  return REGION_ORDER.map((region) => {
    const row = rows.find((r) => r.region === region && r.year === year && r.scenario === scenario);
    return { region, label: REGION_LABELS[region] ?? region, value: row?.value ?? 0 };
  }).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}

function toGisPoints(data: ReturnType<typeof getRegionData>): GisPoint[] {
  return data.map((d) => {
    const [lng, lat] = REGION_CENTROIDS[d.region] ?? [0, 0];
    return { ...d, lng, lat };
  });
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
            subTab === key ? 'border-b-2 border-green-600 text-green-700' : 'text-slate-500 hover:text-slate-700'
          }`}>{label}</button>
      ))}
    </div>
  );

  /* ── SHARED CONTROLS ─────────────────────────────────────── */
  const yearSelector = (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-500">기준 연도</p>
      <div className="flex gap-1.5">
        {TARGET_YEARS.map((y) => (
          <button key={y} onClick={() => setSelectedYear(y)}
            className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors ${
              selectedYear === y ? 'bg-green-600 text-white' : 'border border-green-300 text-slate-600 hover:bg-green-50'
            }`}>{y}</button>
        ))}
      </div>
    </div>
  );

  const modeSelector = (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-500">시나리오</p>
      <div className="flex gap-1.5">
        {MODE_BTNS.map(({ key, label, color }) => (
          <button key={key} onClick={() => setMode(key)}
            className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${mode === key ? 'text-white shadow' : 'border text-slate-600 hover:bg-slate-50'}`}
            style={mode === key ? { backgroundColor: color } : { borderColor: color }}>
            {label}
          </button>
        ))}
      </div>
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
        { name: 'BAU', type: 'bar',
          data: labels.map((l) => ({ value: bauMap[l] ?? 0, itemStyle: { color: SC_COLOR.BAU, opacity: 0.65 } })),
          label: { show: true, position: 'right', formatter: (p: { value: number }) => `${p.value.toFixed(0)}`, fontSize: 10 },
          barMaxWidth: 22 },
        { name: 'NetZero', type: 'bar',
          data: labels.map((l) => ({ value: nzData.find((d) => d.label === l)?.value ?? 0, itemStyle: { color: SC_COLOR.NetZero } })),
          label: { show: true, position: 'right', formatter: (p: { value: number }) => `${p.value.toFixed(0)}`, fontSize: 10 },
          barMaxWidth: 22 },
      ],
    };

    chartContent = (
      <>
        <div className="flex flex-wrap items-center gap-4">{yearSelector}{modeSelector}</div>
        <ReactECharts option={option} style={{ height: 440 }} notMerge />
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#dc2626' }}>BAU</span>
            <span className="inline-block h-3 w-5 rounded opacity-65" style={{ background: '#dc2626' }}/>
            <span className="text-xs text-slate-600">BAU 탄소저장량 (반투명)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#059669' }}>NetZero</span>
            <span className="inline-block h-3 w-5 rounded" style={{ background: '#059669' }}/>
            <span className="text-xs text-slate-600">NetZero 탄소저장량</span>
          </div>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
          <b>산림 탄소저장량:</b> BAU 대비 NetZero 권역별 차이를 비교합니다.
        </div>
      </>
    );
  } else {
    const sc = isHistorical ? 'Historical' : (mode as 'BAU' | 'NetZero');
    const yearData = getRegionData(rows, selectedYear, sc);
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params: { value: number; name: string }[]) =>
          params.length ? `<b>${params[0].name}</b><br/>탄소저장량: <b>${params[0].value.toFixed(1)} Mt C</b>` : '' },
      legend: { show: false },
      grid: { left: 130, right: 70, top: 10, bottom: 30 },
      xAxis: { type: 'value', name: 'Mt C', nameLocation: 'end' },
      yAxis: { type: 'category', data: yearData.map((d) => d.label), axisLabel: { fontSize: 11 } },
      series: [{ type: 'bar',
        data: yearData.map((d) => ({ value: d.value, itemStyle: { color: SC_COLOR[sc] } })),
        label: { show: true, position: 'right', formatter: (p: { value: number }) => `${p.value.toFixed(0)}`, fontSize: 10 },
        barMaxWidth: 30 }],
    };
    chartContent = (
      <>
        <div className="flex flex-wrap items-center gap-4">
          {yearSelector}
          {!isHistorical && modeSelector}
        </div>
        <ReactECharts option={option} style={{ height: 420 }} notMerge />
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
          <b>산림 탄소저장량 (바이오매스 대리 지표):</b> 산림 생물체에 저장된 탄소의 총량 (Mt C).
        </div>
      </>
    );
  }

  /* ── GIS CONTENT ─────────────────────────────────────────── */
  const isCompare = !isHistorical && mode === 'compare';
  const gisSc     = isHistorical ? 'Historical' : (isCompare ? 'NetZero' : mode as 'BAU' | 'NetZero');

  const bauGis = isCompare ? toGisPoints(getRegionData(rows, selectedYear, 'BAU'))    : undefined;
  const nzGis  = isCompare ? toGisPoints(getRegionData(rows, selectedYear, 'NetZero')) : undefined;
  const singleGis = !isCompare ? toGisPoints(getRegionData(rows, selectedYear, gisSc)) : undefined;

  const gisTitle = isCompare
    ? `산림 탄소저장량 — ${selectedYear}년 BAU(빨강) vs NetZero(초록) (Mt C)`
    : `산림 탄소저장량 — ${selectedYear}년 ${gisSc === 'Historical' ? '실적' : gisSc} (Mt C)`;

  const gisContent = (
    <>
      <div className="flex flex-wrap items-center gap-4">
        {yearSelector}
        {!isHistorical && modeSelector}
      </div>
      {isCompare
        ? <GisWorldMap compare bauData={bauGis} nzData={nzGis} unit="Mt C" title={gisTitle} />
        : <GisWorldMap data={singleGis} unit="Mt C" title={gisTitle} />
      }
      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        {isCompare
          ? <><b>비교 모드:</b> 빨간 버블=BAU, 초록 버블=NetZero. 버블 위 마우스로 두 값을 동시에 확인할 수 있습니다.</>
          : <><b>버블 크기</b> = 탄소저장량 (Mt C). 드래그·스크롤로 확대/이동 가능합니다.</>
        }
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      {tabBar}
      {subTab === 'chart' ? chartContent : gisContent}
    </div>
  );
}
