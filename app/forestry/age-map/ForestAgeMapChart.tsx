'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ForestRow } from '@/lib/forest/load';
import { REGION_LABELS, REGION_ORDER } from '@/lib/forest/meta';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: ForestRow[] }

const AGE_CLASSES = [
  { key: 'Area|Forest|Age Class|0-20',  label: '0-20년생',    color: '#bbf7d0' },
  { key: 'Area|Forest|Age Class|21-40', label: '21-40년생',   color: '#4ade80' },
  { key: 'Area|Forest|Age Class|41-60', label: '41-60년생',   color: '#16a34a' },
  { key: 'Area|Forest|Age Class|61+',   label: '61년생 이상', color: '#14532d' },
];

const SCENARIO_COLORS = { BAU: '#dc2626', NetZero: '#059669' };

export function ForestAgeMapChart({ rows }: Props) {
  const [selectedYear, setSelectedYear] = useState(2050);
  const [selectedScenario, setSelectedScenario] = useState<'BAU' | 'NetZero'>('NetZero');
  const TARGET_YEARS = [2020, 2030, 2040, 2050];

  const displayScenario = selectedYear <= 2020 ? 'Historical' : selectedScenario;

  const regionData = REGION_ORDER.map((region) => {
    const label = REGION_LABELS[region] ?? region;
    let total = 0;
    const ageValues = AGE_CLASSES.map((ac) => {
      const row = rows.find(
        (r) => r.region === region && r.variable === ac.key && r.year === selectedYear && r.scenario === displayScenario,
      );
      const v = row?.value ?? 0;
      total += v;
      return v;
    });
    return { region, label, ageValues, total };
  }).filter((d) => d.total > 0).sort((a, b) => b.total - a.total);

  // Stacked horizontal bar: age class share by region
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number; name: string }[]) => {
        if (!params.length) return '';
        const total = params.reduce((s, p) => s + (p.value || 0), 0);
        const lines = params
          .filter((p) => p.value > 0)
          .map((p) => {
            const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0';
            return `${p.seriesName}: <b>${p.value.toFixed(2)} Mha</b> (${pct}%)`;
          });
        return `<div class="text-xs"><b>${params[0].name}</b><br/>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { bottom: 0, data: AGE_CLASSES.map((a) => a.label) },
    grid: { left: 100, right: 20, top: 10, bottom: 55 },
    xAxis: {
      type: 'value',
      name: 'Million ha',
      nameLocation: 'end',
    },
    yAxis: {
      type: 'category',
      data: regionData.map((d) => d.label),
      axisLabel: { fontSize: 11 },
    },
    series: AGE_CLASSES.map((ac, idx) => ({
      name: ac.label,
      type: 'bar',
      stack: 'age',
      data: regionData.map((d) => d.ageValues[idx]),
      itemStyle: { color: ac.color },
      barMaxWidth: 28,
    })),
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
        ⚠️ 국가별 임령 분포 래스터 지도(GeoTIFF)는 별도 GIS 파이프라인으로 제공 예정입니다.
        현재는 권역 집계 데이터로 지역별 영급구조를 비교합니다.
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-500">기준 연도</p>
          <div className="flex gap-1.5">
            {TARGET_YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`rounded px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  selectedYear === y
                    ? 'bg-green-600 text-white'
                    : 'border border-green-300 text-slate-600 hover:bg-green-50'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        {selectedYear > 2020 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-500">시나리오</p>
            <div className="flex gap-1.5">
              {(['BAU', 'NetZero'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedScenario(s)}
                  className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                    selectedScenario === s ? 'text-white' : 'border text-slate-500'
                  }`}
                  style={
                    selectedScenario === s
                      ? { backgroundColor: SCENARIO_COLORS[s] }
                      : { borderColor: SCENARIO_COLORS[s] }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ReactECharts option={option} style={{ height: 400 }} notMerge />

      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>임령지도 (Forest Age Map):</b> 산림의 나이별 분포를 나타냅니다.
        61년생 이상(장령림)이 많을수록 성숙한 산림 생태계를 의미하며,
        탄소저장 밀도가 높습니다. 국가별 세부 래스터 지도는 <code>GeoTIFF_Outputs/</code> 파일에 저장되어 있습니다.
      </div>
    </div>
  );
}
