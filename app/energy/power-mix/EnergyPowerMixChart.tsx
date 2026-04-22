'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { YonseiAnnualRow } from '@/lib/energy/loadYonseiAnnual';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props {
  genmixRows: YonseiAnnualRow[];
  capmixRows: YonseiAnnualRow[];
  years: number[];
}

// Tech display groups (order = stack order, bottom to top)
const TECH_GROUPS: { label: string; techs: string[]; color: string }[] = [
  { label: '석탄',         techs: ['coal'],                       color: '#475569' },
  { label: '가스(CCGT)',   techs: ['CCGT'],                       color: '#f97316' },
  { label: '가스(CCS)',    techs: ['CCGT-CCS'],                   color: '#fb923c' },
  { label: '원자력',       techs: ['Nuclear'],                    color: '#7c3aed' },
  { label: '수력',         techs: ['Hydro'],                      color: '#3b82f6' },
  { label: '바이오매스',   techs: ['Biomass'],                    color: '#22c55e' },
  { label: '태양광',       techs: ['Solar'],                      color: '#eab308' },
  { label: '풍력(육상)',   techs: ['WindOn'],                     color: '#06b6d4' },
  { label: '풍력(해상)',   techs: ['WindOff'],                    color: '#0284c7' },
  { label: 'ESS/양수',     techs: ['ESS', 'PUMP'],                color: '#a78bfa' },
  { label: '기타',         techs: ['OCGT', 'oil', 'waste', 'HUCM'], color: '#cbd5e1' },
];

function aggregateByGroup(rows: YonseiAnnualRow[], years: number[]) {
  return TECH_GROUPS.map((g) => {
    const data = years.map((y) => {
      const total = rows
        .filter((r) => g.techs.includes(r.tech) && r.year === y)
        .reduce((s, r) => s + r.value, 0);
      return total > 0.05 ? Math.round(total * 10) / 10 : null;
    });
    if (data.every((d) => d === null)) return null;
    return { label: g.label, color: g.color, data };
  }).filter(Boolean) as { label: string; color: string; data: (number | null)[] }[];
}

export function EnergyPowerMixChart({ genmixRows, capmixRows, years }: Props) {
  const [mode, setMode] = useState<'genmix' | 'capmix'>('genmix');
  const rows = mode === 'genmix' ? genmixRows : capmixRows;
  const unit = mode === 'genmix' ? 'TWh' : 'GW';

  const groups = aggregateByGroup(rows, years);

  // Total aggregate line
  const totalLine = years.map((y) =>
    Math.round(rows.reduce((s, r) => (r.year === y ? s + r.value : s), 0) * 10) / 10,
  );

  const series: object[] = groups.map((g) => ({
    name: g.label,
    type: 'bar',
    stack: 'mix',
    data: g.data,
    itemStyle: { color: g.color },
    barMaxWidth: 40,
  }));

  series.push({
    name: `합계 (${unit})`,
    type: 'line',
    data: totalLine,
    lineStyle: { color: '#1e293b', width: 2.5 },
    itemStyle: { color: '#1e293b' },
    symbol: 'circle',
    symbolSize: 5,
    z: 10,
  });

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { seriesName: string; value: number | null; axisValue: string }[]) => {
        if (!params.length) return '';
        const year = params[0].axisValue;
        const stackItems = params.filter(
          (p) => p.seriesName !== `합계 (${unit})` && p.value != null && (p.value as number) > 0.05,
        );
        const total = stackItems.reduce((s, p) => s + (p.value as number), 0);
        const lines = stackItems.map(
          (p) => `${p.seriesName}: <b>${(p.value as number).toFixed(1)} ${unit}</b>`,
        );
        return `<div class="text-xs"><b>${year}년</b><br/>${lines.join('<br/>')}<hr style="margin:4px 0"/>합계: <b>${total.toFixed(1)} ${unit}</b></div>`;
      },
    },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 10 } },
    grid: { left: 70, right: 20, bottom: 65, top: 20 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameLocation: 'middle',
      nameGap: 55,
    },
    series,
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['genmix', 'capmix'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1 text-xs font-medium transition-colors ${
              mode === m
                ? 'bg-amber-500 text-white'
                : 'border border-amber-400 text-slate-600 hover:bg-amber-50'
            }`}
          >
            {m === 'genmix' ? '발전량 (TWh)' : '설비용량 (GW)'}
          </button>
        ))}
      </div>

      <ReactECharts option={option} style={{ height: 420 }} notMerge />

      <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        <b>UNICON POWER&CGE 모형 (NetZero 시나리오):</b> 석탄 발전 급감 → 태양광·풍력 확대.
        2035년 이후 CCGT-CCS 도입, ESS 설비 2032년부터 급속 성장.
        해상풍력(WindOff)은 2050년에 본격화. 3년 단위 시뮬레이션 (2020–2050).
      </div>
    </div>
  );
}
