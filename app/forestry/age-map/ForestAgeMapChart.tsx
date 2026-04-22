'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
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

function GisWorldMap({
  data, bauData, nzData, compare = false,
  singleColor = '#16a34a', fixedMax,
  unit, title,
}: {
  data?: GisPoint[];
  bauData?: GisPoint[];
  nzData?: GisPoint[];
  compare?: boolean;
  singleColor?: string;
  fixedMax?: number;
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
        const allPts = compare ? [...(bauData ?? []), ...(nzData ?? [])] : (data ?? []);
        const maxVal = fixedMax ?? Math.max(...allPts.map((d) => d.value), 1);
        const bauMap = Object.fromEntries((bauData ?? []).map((d) => [d.region, d.value]));
        const nzMap  = Object.fromEntries((nzData  ?? []).map((d) => [d.region, d.value]));

        type SI = { name: string; label: string; value: [number, number, number]; bauVal?: number; nzVal?: number };

        const mkSeries = (pts: GisPoint[], color: string, opacity: number, name: string, showLabel: boolean) => ({
          name, type: 'scatter', coordinateSystem: 'geo',
          data: pts.filter((d) => d.value > 0).map((d): SI => ({
            name: d.region, label: d.label,
            value: [d.lng, d.lat, d.value],
            bauVal: bauMap[d.region], nzVal: nzMap[d.region],
          })),
          symbolSize: (val: number[]) => Math.max(6, Math.sqrt(val[2] / maxVal) * 60),
          itemStyle: { color, opacity, borderColor: '#064e3b', borderWidth: 1 },
          label: showLabel
            ? { show: true, formatter: (p: { data?: SI }) => p.data?.label ?? '', position: 'top', fontSize: 9, color: '#1e293b' }
            : { show: false },
          emphasis: { scale: true },
        });

        const series = compare
          ? [mkSeries(bauData ?? [], '#dc2626', 0.55, 'BAU', false), mkSeries(nzData ?? [], '#059669', 0.82, 'NetZero', true)]
          : [mkSeries(data ?? [], singleColor, 0.80, 'Value', true)];

        chart.setOption({
          backgroundColor: '#f0fdf4',
          title: { text: title, left: 'center', top: 8, textStyle: { fontSize: 12, color: '#374151' } },
          tooltip: {
            trigger: 'item',
            formatter: (p: { data?: SI }) => {
              if (!p.data) return '';
              if (compare) {
                return `<b>${p.data.label}</b><br/>BAU: <b>${(p.data.bauVal ?? 0).toFixed(2)} ${unit}</b><br/>NetZero: <b>${(p.data.nzVal ?? 0).toFixed(2)} ${unit}</b>`;
              }
              return `<b>${p.data.label}</b><br/>${p.data.value[2].toFixed(2)} ${unit}`;
            },
          },
          legend: compare ? { bottom: 8, data: ['BAU', 'NetZero'], textStyle: { fontSize: 11 } } : { show: false },
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
  }, [depKey, compare, singleColor, fixedMax, unit]);

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

function buildData(rows: ForestRow[], year: number, scenario: 'BAU' | 'NetZero' | 'Historical') {
  return REGION_ORDER.map((region) => {
    const label = REGION_LABELS[region] ?? region;
    let total = 0;
    const ages = AGE_CLASSES.map((ac) => {
      const row = rows.find((r) => r.region === region && r.variable === ac.key && r.year === year && r.scenario === scenario);
      const v = row?.value ?? 0; total += v; return v;
    });
    return { region, label, ages, total };
  }).filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
}

function toGisPoints(data: ReturnType<typeof buildData>): GisPoint[] {
  return data.map((d) => {
    const [lng, lat] = REGION_CENTROIDS[d.region] ?? [0, 0];
    return { region: d.region, label: d.label, value: d.total, lng, lat };
  });
}

export function ForestAgeMapChart({ rows }: Props) {
  const [subTab,       setSubTab]       = useState<SubTab>('chart');
  const [selectedYear, setSelectedYear] = useState(2050);
  const [mode,         setMode]         = useState<ScenarioMode>('NetZero');

  const isHistorical = selectedYear <= 2020;

  // Fixed max across all years & scenarios for consistent bubble sizing
  const globalMax = useMemo(() => {
    let mx = 1;
    for (const y of TARGET_YEARS) {
      for (const sc of ['BAU', 'NetZero', 'Historical'] as const) {
        for (const d of buildData(rows, y, sc)) mx = Math.max(mx, d.total);
      }
    }
    return mx;
  }, [rows]);

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
    const nzData  = buildData(rows, selectedYear, 'NetZero');
    const bauData = buildData(rows, selectedYear, 'BAU');
    const labels  = nzData.map((d) => d.label);
    const bauMap  = Object.fromEntries(bauData.map((d) => [d.label, d]));

    const compareSeries = AGE_CLASSES.flatMap((ac, idx) => [
      { name: `BAU · ${ac.label}`, type: 'bar', stack: 'BAU',
        data: labels.map((l) => bauMap[l]?.ages[idx] ?? 0),
        itemStyle: { color: ac.color, opacity: 0.55 }, barMaxWidth: 22 },
      { name: `NZ · ${ac.label}`, type: 'bar', stack: 'NetZero',
        data: labels.map((l) => nzData.find((d) => d.label === l)?.ages[idx] ?? 0),
        itemStyle: { color: ac.color }, barMaxWidth: 22 },
    ]);

    chartContent = (
      <>
        <div className="flex flex-wrap items-center gap-4">{yearSelector}{modeSelector}</div>
        <div className="flex items-center gap-6 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2">
          <span className="text-xs font-semibold text-slate-500">막대 구분:</span>
          <span className="flex items-center gap-2 text-xs"><span className="inline-block h-3 w-5 rounded" style={{ background: '#16a34a' }}/>NetZero (불투명)</span>
          <span className="flex items-center gap-2 text-xs"><span className="inline-block h-3 w-5 rounded opacity-55" style={{ background: '#16a34a' }}/>BAU (반투명)</span>
        </div>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
            formatter: (params: { seriesName: string; value: number; name: string }[]) => {
              if (!params.length) return '';
              const bt = params.filter((p) => p.seriesName.startsWith('BAU')).reduce((s, p) => s + (p.value || 0), 0);
              const nt = params.filter((p) => p.seriesName.startsWith('NZ')).reduce((s, p) => s + (p.value || 0), 0);
              return `<div class="text-xs"><b>${params[0].name}</b><br/>BAU: <b>${bt.toFixed(2)} Mha</b><br/>NetZero: <b>${nt.toFixed(2)} Mha</b></div>`;
            }},
          legend: { show: false },
          grid: { left: 120, right: 20, top: 10, bottom: 20 },
          xAxis: { type: 'value', name: 'Million ha', nameLocation: 'end' },
          yAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10 } },
          series: compareSeries,
        }} style={{ height: 440 }} notMerge />
        <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#dc2626' }}>BAU</span>
            {AGE_CLASSES.map((ac) => (
              <span key={ac.key} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block h-3 w-5 rounded opacity-55" style={{ background: ac.color }}/>{ac.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: '#059669' }}>NetZero</span>
            {AGE_CLASSES.map((ac) => (
              <span key={ac.key} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block h-3 w-5 rounded" style={{ background: ac.color }}/>{ac.label}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
          <b>임령지도:</b> BAU(반투명)와 NetZero(불투명) 영급구조 차이를 권역별로 비교합니다.
        </div>
      </>
    );
  } else {
    const sc = isHistorical ? 'Historical' : (mode as 'BAU' | 'NetZero');
    const regionData = buildData(rows, selectedYear, sc);
    const scColor = isHistorical ? '#64748b' : mode === 'BAU' ? '#dc2626' : '#059669';

    chartContent = (
      <>
        <div className="flex flex-wrap items-center gap-4">{yearSelector}{!isHistorical && modeSelector}</div>
        <ReactECharts option={{
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' },
            formatter: (params: { seriesName: string; value: number; name: string }[]) => {
              if (!params.length) return '';
              const total = params.reduce((s, p) => s + (p.value || 0), 0);
              const lines = params.filter((p) => p.value > 0).map((p) => {
                const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
                return `${p.seriesName}: <b>${p.value.toFixed(2)} Mha</b> (${pct}%)`;
              });
              return `<div class="text-xs"><b>${params[0].name}</b><br/>${lines.join('<br/>')}</div>`;
            }},
          legend: { show: false },
          grid: { left: 120, right: 20, top: 10, bottom: 20 },
          xAxis: { type: 'value', name: 'Million ha', nameLocation: 'end' },
          yAxis: { type: 'category', data: regionData.map((d) => d.label), axisLabel: { fontSize: 10 } },
          series: AGE_CLASSES.map((ac, idx) => ({
            name: ac.label, type: 'bar', stack: 'age',
            data: regionData.map((d) => d.ages[idx]),
            itemStyle: { color: ac.color }, barMaxWidth: 28,
          })),
        }} style={{ height: 420 }} notMerge />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2">
          <span className="w-16 flex-shrink-0 text-xs font-bold" style={{ color: scColor }}>
            {isHistorical ? '실적' : mode}
          </span>
          {AGE_CLASSES.map((ac) => (
            <span key={ac.key} className="flex items-center gap-1.5 text-xs">
              <span className="inline-block h-3 w-5 rounded" style={{ background: ac.color }}/>{ac.label}
            </span>
          ))}
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
          <b>임령지도:</b> 산림의 나이별 면적 분포. 61년생 이상(장령림)이 탄소저장 밀도가 높습니다.
        </div>
      </>
    );
  }

  /* ── GIS CONTENT ─────────────────────────────────────────── */
  const isCompare      = !isHistorical && mode === 'compare';
  const gisSc          = isHistorical ? 'Historical' : (isCompare ? 'NetZero' : mode as 'BAU' | 'NetZero');
  const gisBubbleColor = isHistorical ? '#64748b' : gisSc === 'BAU' ? '#dc2626' : '#059669';

  const bauGis    = isCompare ? toGisPoints(buildData(rows, selectedYear, 'BAU'))     : undefined;
  const nzGis     = isCompare ? toGisPoints(buildData(rows, selectedYear, 'NetZero')) : undefined;
  const singleGis = !isCompare ? toGisPoints(buildData(rows, selectedYear, gisSc))    : undefined;

  const gisTitle = isCompare
    ? `산림 면적 — ${selectedYear}년 BAU(빨강) vs NetZero(초록) (Mha)`
    : `산림 면적 — ${selectedYear}년 ${gisSc === 'Historical' ? '실적' : gisSc} (Mha)`;

  const gisContent = (
    <>
      <div className="flex flex-wrap items-center gap-4">{yearSelector}{!isHistorical && modeSelector}</div>
      {isCompare
        ? <GisWorldMap compare bauData={bauGis} nzData={nzGis} fixedMax={globalMax} unit="Mha" title={gisTitle} />
        : <GisWorldMap data={singleGis} singleColor={gisBubbleColor} fixedMax={globalMax} unit="Mha" title={gisTitle} />
      }
      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        {isCompare
          ? <><b>비교 모드:</b> 빨간 버블=BAU, 초록 버블=NetZero. 버블 위 마우스로 두 값을 동시에 확인합니다.</>
          : <><b>버블 크기</b>는 전체 연도 기준 고정 스케일 — 연도 간 크기 비교 가능합니다.</>
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
