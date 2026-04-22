'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { ForestRow } from '@/lib/forest/load';
import { REGION_LABELS, REGION_ORDER } from '@/lib/forest/meta';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props {
  stockRows: ForestRow[];   // Carbon Stock|Forest|Total
  areaRows:  ForestRow[];   // Area|Forest|Age Class|* (all 4 age classes)
}

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

function GisWorldMap({ data, unit, title }: { data: GisPoint[]; unit: string; title: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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
        const maxVal = Math.max(...data.map((d) => d.value), 1);
        chart.setOption({
          backgroundColor: '#f0fdf4',
          title: { text: title, left: 'center', top: 8, textStyle: { fontSize: 12, color: '#374151' } },
          tooltip: {
            trigger: 'item',
            formatter: (p: { data?: { label: string; value: [number, number, number] } }) =>
              p.data ? `<b>${p.data.label}</b><br/>${p.data.value[2].toFixed(1)} ${unit}` : '',
          },
          geo: {
            map: 'world', roam: true, top: 40,
            itemStyle: { areaColor: '#dcfce7', borderColor: '#86efac', borderWidth: 0.5 },
            emphasis: { itemStyle: { areaColor: '#bbf7d0' }, label: { show: false } },
          },
          series: [{
            type: 'scatter', coordinateSystem: 'geo',
            data: data.filter((d) => d.value > 0).map((d) => ({
              name: d.region, label: d.label,
              value: [d.lng, d.lat, d.value] as [number, number, number],
            })),
            symbolSize: (val: number[]) => Math.max(8, Math.sqrt(val[2] / maxVal) * 56),
            itemStyle: { color: '#15803d', opacity: 0.72, borderColor: '#064e3b', borderWidth: 1 },
            label: {
              show: true,
              formatter: (p: { data?: { label: string } }) => p.data?.label ?? '',
              position: 'top', fontSize: 9, color: '#1e293b',
            },
            emphasis: { scale: true },
          }],
        });
        if (!disposed) setStatus('ready');
      } catch { if (!disposed) setStatus('error'); }
    }
    init();
    return () => { disposed = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data.map((d) => [d.region, d.value])), unit]);

  if (status === 'error') {
    return (
      <div className="flex h-60 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700">
        ⚠️ 지도 데이터를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.
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
      <div ref={divRef} style={{ height: 420, width: '100%' }} />
    </div>
  );
}

/** Carbon Stock (Mt C) / Total Forest Area (Mha) = t C/ha (탄소밀도, 지위지수 대리지표) */
function computeDensity(
  stockRows: ForestRow[],
  areaRows:  ForestRow[],
  year: number,
  scenario: 'BAU' | 'NetZero' | 'Historical',
) {
  return REGION_ORDER.map((region) => {
    const label  = REGION_LABELS[region] ?? region;
    const stock  = stockRows.find((r) => r.region === region && r.year === year && r.scenario === scenario)?.value ?? 0;
    const area   = areaRows.filter((r) => r.region === region && r.year === year && r.scenario === scenario)
      .reduce((s, r) => s + r.value, 0);
    // Mt C / Mha = t C / ha
    const density = area > 0 ? stock / area : 0;
    return { region, label, density, stock, area };
  }).filter((d) => d.density > 0).sort((a, b) => b.density - a.density);
}

export function ForestSiteIndexChart({ stockRows, areaRows }: Props) {
  const [subTab,       setSubTab]       = useState<SubTab>('chart');
  const [selectedYear, setSelectedYear] = useState(2050);
  const [mode,         setMode]         = useState<ScenarioMode>('NetZero');

  const isHistorical = selectedYear <= 2020;

  const tabBar = (
    <div className="flex gap-1 border-b border-slate-200">
      {([['chart', '📊 통계 차트'], ['gis', '🗺️ GIS 지도']] as [SubTab, string][]).map(([key, label]) => (
        <button key={key} onClick={() => setSubTab(key)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === key ? 'border-b-2 border-green-600 text-green-700' : 'text-slate-500 hover:text-slate-700'
          }`}>
          {label}
        </button>
      ))}
    </div>
  );

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

  const scenarioSelector = (
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
    const bauData = computeDensity(stockRows, areaRows, selectedYear, 'BAU');
    const nzData  = computeDensity(stockRows, areaRows, selectedYear, 'NetZero');
    const labels  = nzData.map((d) => d.label);
    const bauMap  = Object.fromEntries(bauData.map((d) => [d.label, d.density]));

    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { show: false },
      grid: { left: 130, right: 80, top: 10, bottom: 30 },
      xAxis: { type: 'value', name: 't C/ha', nameLocation: 'end' },
      yAxis: { type: 'category', data: labels, axisLabel: { fontSize: 11 } },
      series: [
        { name: 'BAU', type: 'bar',
          data: labels.map((l) => ({ value: bauMap[l] ?? 0, itemStyle: { color: SC_COLOR.BAU, opacity: 0.65 } })),
          label: { show: true, position: 'right', formatter: (p: { value: number }) => p.value.toFixed(1), fontSize: 10 },
          barMaxWidth: 22 },
        { name: 'NetZero', type: 'bar',
          data: labels.map((l) => ({ value: nzData.find((d) => d.label === l)?.density ?? 0, itemStyle: { color: SC_COLOR.NetZero } })),
          label: { show: true, position: 'right', formatter: (p: { value: number }) => p.value.toFixed(1), fontSize: 10 },
          barMaxWidth: 22 },
      ],
    };

    chartContent = (
      <>
        <div className="flex flex-wrap items-center gap-4">{yearSelector}{scenarioSelector}</div>
        <ReactECharts option={option} style={{ height: 440 }} notMerge />
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#dc2626' }}>BAU</span>
            <span className="inline-block h-3 w-5 rounded opacity-65" style={{ background: '#dc2626' }}/>
            <span className="text-xs text-slate-600">BAU 탄소밀도 (반투명)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#059669' }}>NetZero</span>
            <span className="inline-block h-3 w-5 rounded" style={{ background: '#059669' }}/>
            <span className="text-xs text-slate-600">NetZero 탄소밀도</span>
          </div>
        </div>
      </>
    );
  } else {
    const sc   = isHistorical ? 'Historical' : (mode as 'BAU' | 'NetZero');
    const data = computeDensity(stockRows, areaRows, selectedYear, sc);

    const option = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (params: { value: number; name: string }[]) =>
          params.length ? `<b>${params[0].name}</b><br/>탄소밀도: <b>${params[0].value.toFixed(1)} t C/ha</b>` : '',
      },
      legend: { show: false },
      grid: { left: 130, right: 70, top: 10, bottom: 30 },
      xAxis: { type: 'value', name: 't C/ha', nameLocation: 'end' },
      yAxis: { type: 'category', data: data.map((d) => d.label), axisLabel: { fontSize: 11 } },
      series: [{ type: 'bar',
        data: data.map((d) => ({ value: d.density, itemStyle: { color: SC_COLOR[sc] } })),
        label: { show: true, position: 'right', formatter: (p: { value: number }) => p.value.toFixed(1), fontSize: 10 },
        barMaxWidth: 30 }],
    };

    chartContent = (
      <>
        <div className="flex flex-wrap items-center gap-4">
          {yearSelector}
          {!isHistorical && scenarioSelector}
        </div>
        <ReactECharts option={option} style={{ height: 420 }} notMerge />
      </>
    );
  }

  /* ── GIS CONTENT ─────────────────────────────────────────── */
  const gisSc    = isHistorical ? 'Historical' : (mode === 'compare' ? 'NetZero' : mode as 'BAU' | 'NetZero');
  const gisData  = computeDensity(stockRows, areaRows, selectedYear, gisSc).map((d) => {
    const [lng, lat] = REGION_CENTROIDS[d.region] ?? [0, 0];
    return { region: d.region, label: d.label, value: d.density, lng, lat };
  });
  const gisTitle = `탄소밀도 — ${selectedYear}년 ${gisSc === 'Historical' ? '실적' : gisSc} (t C/ha)`;

  const gisContent = (
    <>
      <div className="flex flex-wrap items-center gap-4">
        {yearSelector}
        {!isHistorical && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-500">시나리오</p>
            <div className="flex gap-1.5">
              {MODE_BTNS.filter((b) => b.key !== 'compare').map(({ key, label, color }) => (
                <button key={key} onClick={() => setMode(key as ScenarioMode)}
                  className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${(mode === key || (mode === 'compare' && key === 'NetZero')) ? 'text-white shadow' : 'border text-slate-600 hover:bg-slate-50'}`}
                  style={(mode === key || (mode === 'compare' && key === 'NetZero')) ? { backgroundColor: color } : { borderColor: color }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <GisWorldMap data={gisData} unit="t C/ha" title={gisTitle} />
      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>버블 크기</b> = 탄소밀도 (t C/ha). 드래그·스크롤로 확대/이동 가능합니다.
      </div>
    </>
  );

  /* ── SINGLE RETURN ───────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <p className="font-semibold">📊 탄소밀도 = 지위지수 대리지표</p>
        <p className="mt-1">
          IAMC CSV에는 지위지수(Site Index) 변수가 없어 <b>탄소저장량 ÷ 산림면적 (t C/ha)</b>을
          지위지수 대리지표로 표시합니다. 실제 지위지수 GeoTIFF 렌더링은 별도 파이프라인으로 제공 예정입니다.
        </p>
      </div>
      {tabBar}
      {subTab === 'chart' ? chartContent : gisContent}
      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>탄소밀도 (Carbon Density):</b> 단위 면적당 탄소저장량 (t C/ha). 수치가 높을수록
        산림 생산성·품질이 높음을 의미합니다. NetZero 시나리오에서 BAU 대비 탄소밀도가 증가합니다.
      </div>
    </div>
  );
}
