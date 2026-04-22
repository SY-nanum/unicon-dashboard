'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type SubTab = 'chart' | 'gis';

interface SiteIndexStats {
  file: string;
  bounds: { west: number; south: number; east: number; north: number };
  stats: { min: number; max: number; mean: number };
  unit: string;
  label: string;
}

interface MetaJson {
  [country: string]: { siteindex?: SiteIndexStats };
}

const COUNTRY_LABELS: Record<string, string> = {
  KOR: '한국',
  JPN: '일본',
  CHN: '중국',
  USA: '미국',
  CAN: '캐나다',
  AUS: '호주',
  DEU: '독일',
  BRA: '브라질',
  IDN: '인도네시아',
  IND: '인도',
  RUS: '러시아',
  GBR: '영국',
  FRA: '프랑스',
};

const COUNTRIES = Object.keys(COUNTRY_LABELS);

/** Blue → Red gradient legend matching render-forest-maps.py colormap_siteindex (vmin=8, vmax=26) */
function SiteIndexLegend({ vmin = 8, vmax = 26 }: { vmin?: number; vmax?: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="font-medium">{vmin}m</span>
      <div
        className="h-3 w-36 flex-shrink-0 rounded"
        style={{ background: 'linear-gradient(to right, #3264dc, #64c87e, #fa3e14)' }}
      />
      <span className="font-medium">{vmax}m</span>
      <span className="ml-1 text-slate-400">| 높을수록 생산력 우수</span>
    </div>
  );
}

export function ForestSiteIndexChart() {
  const [subTab, setSubTab] = useState<SubTab>('gis');
  const [meta, setMeta] = useState<MetaJson | null>(null);
  const [metaError, setMetaError] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('KOR');

  useEffect(() => {
    fetch('/maps/meta.json')
      .then((r) => r.json())
      .then((d) => setMeta(d as MetaJson))
      .catch(() => setMetaError(true));
  }, []);

  /* ── Build chart data from meta ─────────────────── */
  const chartData = COUNTRIES.map((code) => ({
    code,
    label: COUNTRY_LABELS[code],
    mean: meta?.[code]?.siteindex?.stats.mean ?? 0,
    min:  meta?.[code]?.siteindex?.stats.min  ?? 0,
    max:  meta?.[code]?.siteindex?.stats.max  ?? 0,
  }))
    .filter((d) => d.mean > 0)
    .sort((a, b) => b.mean - a.mean);

  /* ── TAB BAR ─────────────────────────────────────── */
  const TABS: [SubTab, string][] = [
    ['chart', '📊 통계 차트'],
    ['gis', '🗺️ GIS 지도'],
  ];
  const tabBar = (
    <div className="flex gap-1 border-b border-slate-200">
      {TABS.map(([key, label]) => (
        <button
          key={key}
          onClick={() => setSubTab(key)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            subTab === key
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  /* ── CHART TAB ───────────────────────────────────── */
  const chartContent = (
    <div className="space-y-3">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        📍 <b>지위지수(Site Index)</b>: 기준 임령 50년에서 우세목의 평균 수고(m). 값이 높을수록 임지 생산력이 우수합니다.
      </div>
      {metaError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠️ 메타데이터를 불러오지 못했습니다.
        </div>
      )}
      {!meta && !metaError && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          데이터 로딩 중…
        </div>
      )}
      {meta && chartData.length > 0 && (
        <ReactECharts
          option={{
            tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'shadow' },
              formatter: (params: { name: string }[]) => {
                const d = chartData.find((c) => c.label === params[0]?.name);
                if (!d) return '';
                return (
                  `<b>${d.label} (${d.code})</b><br/>` +
                  `평균: <b>${d.mean.toFixed(1)} m</b><br/>` +
                  `범위: ${d.min.toFixed(0)} – ${d.max.toFixed(0)} m`
                );
              },
            },
            grid: { left: 80, right: 90, top: 10, bottom: 30 },
            xAxis: { type: 'value', name: '지위지수 (m)', nameLocation: 'end', min: 0 },
            yAxis: {
              type: 'category',
              data: chartData.map((d) => d.label),
              axisLabel: { fontSize: 11 },
            },
            series: [
              {
                type: 'bar',
                data: chartData.map((d) => ({
                  value: d.mean,
                  itemStyle: { color: '#3b82f6' },
                })),
                label: {
                  show: true,
                  position: 'right',
                  formatter: (p: { value: number }) => `${p.value.toFixed(1)} m`,
                  fontSize: 10,
                },
                barMaxWidth: 30,
              },
            ],
          }}
          style={{ height: 380 }}
          notMerge
        />
      )}
      <SiteIndexLegend />
    </div>
  );

  /* ── GIS TAB ─────────────────────────────────────── */
  const si = meta?.[selectedCountry]?.siteindex;

  const gisContent = (
    <div className="space-y-3">
      {/* Country selector */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">국가 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {COUNTRIES.map((code) => (
            <button
              key={code}
              onClick={() => setSelectedCountry(code)}
              className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors ${
                selectedCountry === code
                  ? 'bg-blue-600 text-white'
                  : 'border border-blue-300 text-slate-600 hover:bg-blue-50'
              }`}
            >
              {COUNTRY_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / error states */}
      {metaError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠️ 지도 데이터를 불러오지 못했습니다.
        </div>
      )}
      {!meta && !metaError && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          🗺️ 데이터 로딩 중…
        </div>
      )}

      {/* Map image */}
      {meta && si && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={si.file}
              alt={`${COUNTRY_LABELS[selectedCountry]} 지위지수 지도`}
              className="w-full object-contain"
              style={{ imageRendering: 'pixelated', maxHeight: 420 }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-blue-50 px-3 py-2">
              <div className="text-base font-bold text-blue-600">{si.stats.min.toFixed(0)} m</div>
              <div className="text-slate-500">최솟값</div>
            </div>
            <div className="rounded-lg bg-blue-100 px-3 py-2">
              <div className="text-base font-bold text-blue-800">{si.stats.mean.toFixed(1)} m</div>
              <div className="text-slate-500">평균</div>
            </div>
            <div className="rounded-lg bg-blue-50 px-3 py-2">
              <div className="text-base font-bold text-blue-600">{si.stats.max.toFixed(0)} m</div>
              <div className="text-slate-500">최댓값</div>
            </div>
          </div>

          <SiteIndexLegend />

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
            영역: {si.bounds.west.toFixed(2)}°E ~ {si.bounds.east.toFixed(2)}°E &nbsp;/&nbsp;
            {si.bounds.south.toFixed(2)}°N ~ {si.bounds.north.toFixed(2)}°N
          </div>
        </div>
      )}

      {/* Country in meta but no siteindex band */}
      {meta && !si && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {COUNTRY_LABELS[selectedCountry]} ({selectedCountry}) 지위지수 데이터 없음
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <p className="font-semibold">🌲 지위지수 (Site Index) — GeoTIFF Historical Band 17 (Siteindex_m)</p>
        <p className="mt-1">
          기준 임령 50년에서 우세목의 평균 수고로 임지 생산력을 나타냅니다.
          토양·지형에 의해 결정되는 정적(static) 속성으로 BAU/NetZero 시나리오에 따라 변화하지 않습니다.
        </p>
      </div>

      {tabBar}

      {subTab === 'chart' ? chartContent : gisContent}
    </div>
  );
}
