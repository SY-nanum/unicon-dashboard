'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ForestRow } from '@/lib/forest/load';
import { REGION_LABELS, REGION_ORDER } from '@/lib/forest/meta';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: ForestRow[] }

const AGE_CLASSES = [
  { key: 'Area|Forest|Age Class|0-20',  label: '0-20년생',  color: '#bbf7d0' },
  { key: 'Area|Forest|Age Class|21-40', label: '21-40년생', color: '#4ade80' },
  { key: 'Area|Forest|Age Class|41-60', label: '41-60년생', color: '#16a34a' },
  { key: 'Area|Forest|Age Class|61+',   label: '61년생 이상', color: '#14532d' },
];

const SCENARIO_LABELS = { BAU: 'BAU', NetZero: 'NetZero', Historical: '실적' };

export function ForestAgeClassChart({ rows }: Props) {
  const availableRegions = REGION_ORDER.filter((r) =>
    rows.some((row) => row.region === r),
  );
  const [selectedRegion, setSelectedRegion] = useState('Republic of Korea');
  const [selectedScenario, setSelectedScenario] = useState<'Historical' | 'BAU' | 'NetZero'>('BAU');

  const filtered = rows.filter(
    (r) => r.region === selectedRegion && r.scenario === selectedScenario,
  );
  const years = [...new Set(filtered.map((r) => r.year))].sort((a, b) => a - b);

  const series = AGE_CLASSES.map((ac) => {
    const ageRows = filtered.filter((r) => r.variable === ac.key);
    const dataMap = Object.fromEntries(ageRows.map((r) => [r.year, r.value]));
    return {
      name: ac.label,
      type: 'bar',
      stack: 'age',
      data: years.map((y) => dataMap[y] ?? 0),
      itemStyle: { color: ac.color },
    };
  });

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
        if (!params.length) return '';
        const year = params[0].axisValue;
        const total = params.reduce((s, p) => s + (p.value || 0), 0);
        const lines = params
          .filter((p) => p.value > 0)
          .map((p) => `${p.seriesName}: <b>${p.value.toFixed(2)} Mha</b>`);
        return `<div class="text-xs"><b>${year}년</b><br/>${lines.join('<br/>')}<hr style="margin:4px 0"/>합계: <b>${total.toFixed(2)} Mha</b></div>`;
      },
    },
    legend: { bottom: 0, data: AGE_CLASSES.map((a) => a.label) },
    grid: { left: 70, right: 20, bottom: 55, top: 20 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'Million ha',
      nameLocation: 'middle',
      nameGap: 55,
    },
    series,
  };

  const scenarioBtnStyle = (s: string) => {
    if (s === selectedScenario) {
      const colors: Record<string, string> = { Historical: '#64748b', BAU: '#dc2626', NetZero: '#059669' };
      return { className: 'rounded-full px-3 py-0.5 text-xs font-medium text-white', style: { backgroundColor: colors[s] } };
    }
    return { className: 'rounded-full border px-3 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-50', style: {} };
  };

  return (
    <div className="space-y-4">
      {/* Region selector */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-500">권역 선택</p>
        <div className="flex flex-wrap gap-1.5">
          {availableRegions.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                selectedRegion === r
                  ? 'bg-green-600 text-white'
                  : 'border border-green-300 text-slate-600 hover:bg-green-50'
              }`}
            >
              {REGION_LABELS[r] ?? r}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario selector */}
      <div className="flex gap-2">
        {(['Historical', 'BAU', 'NetZero'] as const).map((s) => {
          const { className, style } = scenarioBtnStyle(s);
          return (
            <button key={s} onClick={() => setSelectedScenario(s)} className={className} style={style}>
              {SCENARIO_LABELS[s]}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          선택한 권역/시나리오의 데이터가 없습니다
        </div>
      ) : (
        <ReactECharts option={option} style={{ height: 380 }} notMerge />
      )}

      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <b>영급구조 (Age Class):</b> 산림의 수령별 면적 분포.
        0-20년생(유령림)의 비율이 높을수록 빠른 흡수 잠재력이 있으며,
        61년생 이상(장령림)은 탄소저장 밀도가 높습니다.
        NetZero 시나리오에서 장령림 비율이 어떻게 변화하는지 확인하세요.
      </div>
    </div>
  );
}
