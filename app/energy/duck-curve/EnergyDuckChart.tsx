'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Row {
  tsIndex: number;
  season: number;
  hour: number;
  item: string;
  year: number;
  value: number;
}

interface Props {
  rows: Row[];
  years: number[];
  seasons: number[];
}

// Season labels (season 1 has highest solar → spring/summer-like)
const SEASON_LABELS: Record<number, string> = {
  1: '계절 1 (봄형)',
  2: '계절 2 (여름형)',
  3: '계절 3 (가을형)',
  4: '계절 4 (겨울형)',
};

const HOURS = Array.from({ length: 24 }, (_, i) => `${i}시`);

export function EnergyDuckChart({ rows, years, seasons }: Props) {
  const [selectedYear, setSelectedYear] = useState<number>(years[years.length - 1] ?? 2050);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  // Derive 24-hour profile for selected year + season
  const profile = useMemo(() => {
    const filtered = rows.filter(
      (r) => r.year === selectedYear && r.season === selectedSeason,
    );

    const netload = Array<number | null>(24).fill(null);
    const solar   = Array<number | null>(24).fill(null);

    for (const r of filtered) {
      if (r.item === 'netload') netload[r.hour] = r.value;
      if (r.item === 'Solar')  solar[r.hour]  = r.value;
    }

    // Demand = netload + solar (where both exist)
    const demand = Array<number | null>(24).fill(null);
    for (let h = 0; h < 24; h++) {
      const nl = netload[h];
      const s  = solar[h];
      if (nl !== null && s !== null) demand[h] = nl + s;
      else if (nl !== null) demand[h] = nl;
    }

    return { netload, solar, demand };
  }, [rows, selectedYear, selectedSeason]);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (
        params: { seriesName: string; value: number | null; name: string }[],
      ) => {
        const hour = params[0]?.name ?? '';
        const lines = params
          .filter((p) => p.value != null)
          .map(
            (p) =>
              `${p.seriesName}: <b>${(p.value as number).toFixed(1)} GW</b>`,
          );
        return `<div class="text-xs"><div class="font-semibold mb-1">${hour}</div>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { bottom: 0 },
    grid: { left: 65, right: 20, bottom: 50, top: 20 },
    xAxis: {
      type: 'category',
      data: HOURS,
      axisLabel: { interval: 2 },
    },
    yAxis: {
      type: 'value',
      name: 'GW',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: { formatter: (v: number) => `${v.toFixed(0)}` },
    },
    series: [
      {
        name: '총 수요 (Demand)',
        type: 'line',
        data: profile.demand,
        lineStyle: { color: '#2563eb', width: 2.5 },
        itemStyle: { color: '#2563eb' },
        symbol: 'none',
        smooth: true,
      },
      {
        name: '태양광 발전 (Solar)',
        type: 'line',
        data: profile.solar,
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b' },
        symbol: 'none',
        smooth: true,
        areaStyle: { color: 'rgba(245,158,11,0.18)' },
      },
      {
        name: '순부하 (Net Load)',
        type: 'line',
        data: profile.netload,
        lineStyle: { color: '#059669', width: 3, type: 'solid' },
        itemStyle: { color: '#059669' },
        symbol: 'none',
        smooth: true,
      },
      // Mark the minimum net load point (Duck's belly)
      {
        name: '순부하 최소점',
        type: 'scatter',
        data: (() => {
          let minVal = Infinity;
          let minHour = -1;
          for (let h = 0; h < 24; h++) {
            const v = profile.netload[h];
            if (v !== null && v < minVal) { minVal = v; minHour = h; }
          }
          return minHour >= 0 ? [[HOURS[minHour], minVal]] : [];
        })(),
        symbolSize: 10,
        itemStyle: { color: '#dc2626' },
        label: {
          show: true,
          position: 'top',
          formatter: (p: { value: (string | number)[] }) =>
            `최저 ${(p.value[1] as number).toFixed(1)}GW`,
          fontSize: 11,
          color: '#dc2626',
        },
      },
    ],
    markLine: {},
  };

  return (
    <div>
      {/* Year selector */}
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm font-medium text-slate-500">연도:</span>
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
              selectedYear === y
                ? 'bg-amber-500 text-white'
                : 'border border-slate-300 text-slate-600 hover:bg-amber-50'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Season selector */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm font-medium text-slate-500">계절:</span>
        {seasons.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSeason(s)}
            className={`rounded-full px-3.5 py-1 text-sm font-medium transition-all ${
              selectedSeason === s
                ? 'bg-amber-500 text-white'
                : 'border border-slate-300 text-slate-600 hover:bg-amber-50'
            }`}
          >
            {SEASON_LABELS[s] ?? `계절 ${s}`}
          </button>
        ))}
      </div>

      <p className="mb-2 text-center text-xs text-slate-400">
        {selectedYear}년 {SEASON_LABELS[selectedSeason]} 대표일 24시간 수급 곡선
        &nbsp;|&nbsp; 빨간 점: 순부하 최저(오리배 배)
      </p>

      <ReactECharts option={option} style={{ height: 400 }} notMerge key={`${selectedYear}-${selectedSeason}`} />

      {/* Duck Curve explanation */}
      <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        <b>Duck Curve(오리 곡선) 해석:</b> 낮 시간대 태양광 급증 → 순부하 급감(오리 배),
        일몰 후 수요 급증 → 계통 급격한 상승(오리 목). 재생에너지 비중 증가에 따라 이 곡선의
        깊이가 심화됩니다.
      </div>
    </div>
  );
}
