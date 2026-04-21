'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const VAR_LABELS: Record<string, string> = {
  'Damage|Agriculture': '농업',
  'Damage|Labor':       '노동생산성',
  'Damage|Tourism':     '관광',
  'Damage|Energy':      '에너지',
};

const VAR_COLORS: Record<string, string> = {
  'Damage|Agriculture': '#f59e0b',
  'Damage|Labor':       '#ef4444',
  'Damage|Tourism':     '#8b5cf6',
  'Damage|Energy':      '#3b82f6',
};

const ALL_VARS = Object.keys(VAR_LABELS);

type ViewMode = 'line' | 'heatmap';

export function IntDamageChart({ rows }: { rows: IamcRow[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('line');
  const [selected, setSelected] = useState<string[]>(ALL_VARS);

  const availableVars = ALL_VARS.filter((v) => rows.some((r) => r.variable === v));
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

  function toggleVar(v: string) {
    setSelected((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  // ─── Line chart option ────────────────────────────────────────────────
  const lineSeries = availableVars
    .filter((v) => selected.includes(v))
    .map((v) => ({
      name: VAR_LABELS[v] ?? v,
      type: 'line',
      smooth: true,
      connectNulls: false,
      data: years.map((y) => rows.find((r) => r.variable === v && r.year === y)?.value ?? null),
      lineStyle: { color: VAR_COLORS[v] ?? '#6366f1', width: 2.5 },
      itemStyle: { color: VAR_COLORS[v] ?? '#6366f1' },
      symbol: 'circle',
      symbolSize: 6,
      areaStyle: { color: VAR_COLORS[v] ? `${VAR_COLORS[v]}22` : '#6366f122' },
    }));

  const lineOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
        if (!params.length) return '';
        const year = params[0].axisValue;
        const lines = params
          .filter((p) => p.value != null)
          .map((p) => `${p.seriesName}: <b>${p.value?.toFixed(2)}%</b>`);
        return `<div class="text-xs"><div class="font-semibold mb-1">${year}년</div>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { bottom: 0 },
    grid: { left: 60, right: 20, bottom: 60, top: 20 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: '피해율 (%)',
      nameLocation: 'middle',
      nameGap: 45,
      axisLabel: { formatter: (v: number) => `${v.toFixed(1)}%` },
    },
    series: lineSeries,
  };

  // ─── Heatmap option ───────────────────────────────────────────────────
  // ECharts heatmap: xAxis = years, yAxis = sectors, value = damage %
  const heatData: number[][] = [];
  availableVars.forEach((v, yi) => {
    years.forEach((y, xi) => {
      const val = rows.find((r) => r.variable === v && r.year === y)?.value;
      if (val != null) heatData.push([xi, yi, parseFloat(val.toFixed(3))]);
    });
  });

  // Max damage value for colour range
  const maxDamage = Math.max(...heatData.map((d) => d[2]), 0.5);

  const heatOption = {
    tooltip: {
      formatter: (params: { value: number[] }) => {
        const [xi, yi, val] = params.value;
        const sector = VAR_LABELS[availableVars[yi]] ?? availableVars[yi];
        const year = years[xi];
        return `${sector} (${year}년): <b>${val.toFixed(3)}%</b>`;
      },
    },
    grid: { left: 90, right: 60, bottom: 60, top: 20 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      splitArea: { show: true },
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'category',
      data: availableVars.map((v) => VAR_LABELS[v] ?? v),
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: maxDamage,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#fff7ed', '#fed7aa', '#f97316', '#c2410c', '#7c2d12'] },
      text: ['高', '低'],
    },
    series: [
      {
        name: '피해율 (%)',
        type: 'heatmap',
        data: heatData,
        label: { show: true, formatter: (params: { value: number[] }) => `${params.value[2].toFixed(2)}%` },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
      },
    ],
  };

  const hasData = rows.length > 0;

  return (
    <div>
      {hasData ? (
        <>
          {/* View mode toggle */}
          <div className="mb-4 flex justify-center gap-2">
            <button
              onClick={() => setViewMode('line')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                viewMode === 'line'
                  ? 'bg-purple-600 text-white'
                  : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              선 그래프
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-purple-600 text-white'
                  : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              히트맵
            </button>
          </div>

          {viewMode === 'line' && (
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm font-medium text-slate-500">부문:</span>
              {availableVars.map((v) => {
                const on = selected.includes(v);
                const color = VAR_COLORS[v] ?? '#6366f1';
                return (
                  <button
                    key={v}
                    onClick={() => toggleVar(v)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-medium transition-all"
                    style={{
                      border: `2px solid ${on ? color : '#94a3b8'}`,
                      background: on ? color : '#fff',
                      color: on ? '#fff' : '#64748b',
                    }}
                  >
                    {VAR_LABELS[v] ?? v}
                  </button>
                );
              })}
            </div>
          )}

          <p className="mb-2 text-center text-xs text-slate-400">
            시나리오: SSP5-8.5 (고탄소 경로) &nbsp;|&nbsp; 기준(2017): 피해율 0% &nbsp;|&nbsp; 2025년 이후 전망은 추후 업데이트
          </p>

          <ReactECharts
            option={viewMode === 'line' ? lineOption : heatOption}
            style={{ height: 380 }}
            notMerge
          />
        </>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
          <span className="text-4xl">🌡️</span>
          <p className="text-sm">부문별 피해 데이터 제출 대기 중</p>
          <p className="text-xs">(2025년 이후 전망치는 추후 업데이트 예정)</p>
        </div>
      )}
    </div>
  );
}
