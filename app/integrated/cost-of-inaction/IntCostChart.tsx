'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// Scenario colour tokens
const SC_COLORS: Record<string, string> = {
  Historical:     '#64748b',
  BAU:            '#dc2626',
  'BAU-Damage':   '#991b1b',
  NetZero:        '#059669',
  'NetZero-Damage': '#065f46',
};

const SC_LABELS: Record<string, string> = {
  Historical:       '실적 (Historical)',
  BAU:              'BAU (피해 미반영)',
  'BAU-Damage':     'BAU-Damage (피해 반영)',
  NetZero:          'NetZero (피해 미반영)',
  'NetZero-Damage': 'NetZero-Damage (피해 반영)',
};

const ALL_SCENARIOS = ['Historical', 'BAU', 'BAU-Damage', 'NetZero', 'NetZero-Damage'];
// Default: show BAU pair to highlight gap
const DEFAULT_SELECTED = ['BAU', 'BAU-Damage'];

export function IntCostChart({ rows }: { rows: IamcRow[] }) {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);

  const availableScenarios = ALL_SCENARIOS.filter((s) =>
    rows.some((r) => r.scenario === s),
  );

  function toggle(s: string) {
    setSelected((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= 3) return [...prev.slice(1), s];
      return [...prev, s];
    });
  }

  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

  // Build series for selected scenarios + invisible BAU-Damage base for area fill
  const series: object[] = [];

  // If both BAU and BAU-Damage selected, add a band-fill between them
  if (selected.includes('BAU') && selected.includes('BAU-Damage')) {
    // Lower boundary (BAU-Damage values used as invisible stack base)
    const damageVals = years.map(
      (y) => rows.find((r) => r.scenario === 'BAU-Damage' && r.year === y)?.value ?? null,
    );
    const bauVals = years.map(
      (y) => rows.find((r) => r.scenario === 'BAU' && r.year === y)?.value ?? null,
    );
    // Gap = BAU - BAU-Damage (can be negative; use abs for fill)
    const gapVals = years.map((_, i) => {
      const d = damageVals[i];
      const b = bauVals[i];
      if (d == null || b == null) return null;
      return Math.abs(b - d);
    });

    // Invisible base series
    series.push({
      name: '__base__',
      type: 'line',
      data: damageVals,
      lineStyle: { opacity: 0 },
      itemStyle: { opacity: 0 },
      stack: 'gdp-band',
      areaStyle: { opacity: 0 },
      symbol: 'none',
      tooltip: { show: false },
      legendHoverLink: false,
      silent: true,
    });
    // Gap area fill
    series.push({
      name: '__gap__',
      type: 'line',
      data: gapVals,
      lineStyle: { opacity: 0 },
      itemStyle: { opacity: 0 },
      stack: 'gdp-band',
      areaStyle: { color: 'rgba(220,38,38,0.15)', opacity: 1 },
      symbol: 'none',
      tooltip: { show: false },
      legendHoverLink: false,
      silent: true,
    });
  }

  // Main scenario lines
  for (const sc of availableScenarios) {
    if (!selected.includes(sc)) continue;
    const isDashed = sc.includes('Damage');
    series.push({
      name: SC_LABELS[sc] ?? sc,
      type: 'line',
      smooth: false,
      connectNulls: false,
      data: years.map(
        (y) => rows.find((r) => r.scenario === sc && r.year === y)?.value ?? null,
      ),
      lineStyle: {
        color: SC_COLORS[sc] ?? '#6366f1',
        width: 2,
        type: isDashed ? 'dashed' : 'solid',
      },
      itemStyle: { color: SC_COLORS[sc] ?? '#6366f1' },
      symbol: 'circle',
      symbolSize: 5,
    });
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
        const visible = params.filter(
          (p) => !p.seriesName.startsWith('__'),
        );
        if (!visible.length) return '';
        const year = visible[0].axisValue;
        const lines = visible.map(
          (p) => `${p.seriesName}: <b>${p.value != null ? p.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : 'N/A'}</b> B USD`,
        );
        return `<div class="text-xs"><div class="font-semibold mb-1">${year}년</div>${lines.join('<br/>')}</div>`;
      },
    },
    legend: {
      bottom: 0,
      formatter: (name: string) => name.startsWith('__') ? '' : name,
      data: availableScenarios.filter((s) => selected.includes(s)).map((s) => SC_LABELS[s] ?? s),
    },
    grid: { left: 80, right: 20, bottom: 70, top: 20 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisLabel: { rotate: 30 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Billion USD',
      nameLocation: 'middle',
      nameGap: 65,
      axisLabel: { formatter: (v: number) => v.toLocaleString() },
    },
    series,
  };

  return (
    <div>
      {/* Scenario chips */}
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm font-medium text-slate-500">시나리오:</span>
        {availableScenarios.map((s) => {
          const on = selected.includes(s);
          const color = SC_COLORS[s] ?? '#6366f1';
          return (
            <button
              key={s}
              onClick={() => toggle(s)}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-medium transition-all"
              style={{
                border: `2px solid ${on ? color : '#94a3b8'}`,
                background: on ? color : '#fff',
                color: on ? '#fff' : '#64748b',
              }}
            >
              {SC_LABELS[s] ?? s}
            </button>
          );
        })}
      </div>

      {/* Gap annotation */}
      {selected.includes('BAU') && selected.includes('BAU-Damage') && (
        <p className="mb-2 text-center text-xs text-slate-400">
          음영 영역: BAU와 BAU-Damage 사이의 GDP 차이 (기후 피해로 인한 손실)
        </p>
      )}

      <ReactECharts option={option} style={{ height: 380 }} notMerge />
    </div>
  );
}
