'use client';

import dynamic from 'next/dynamic';
import type { IamcRow } from '@/lib/iamc/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: IamcRow[] }

const VAR_META: Record<string, { label: string; color: string; dash?: boolean }> = {
  'Price|Electricity|Coal|LCOE': {
    label: '석탄 LCOE (탄소세 반영)',
    color: '#475569',
  },
  'Price|Electricity|Solar|LCOE': {
    label: '태양광 LCOE',
    color: '#f59e0b',
  },
};

export function EnergyLcoeChart({ rows }: Props) {
  if (!rows.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
        <span className="text-4xl">💰</span>
        <p className="text-sm">LCOE 전망 데이터 제출 대기 중</p>
      </div>
    );
  }

  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const variables = Object.keys(VAR_META).filter((v) =>
    rows.some((r) => r.variable === v),
  );

  const series: object[] = [];

  for (const v of variables) {
    const meta = VAR_META[v];

    // Historical
    const histRows = rows.filter((r) => r.variable === v && r.scenario === 'Historical');
    if (histRows.length) {
      series.push({
        name: `${meta.label} (실적)`,
        type: 'line',
        data: years.map((y) => histRows.find((r) => r.year === y)?.value ?? null),
        lineStyle: { color: meta.color, width: 3 },
        itemStyle: { color: meta.color },
        symbol: 'circle',
        symbolSize: 8,
        connectNulls: false,
      });
    }

    // NetZero projection
    const nzRows = rows.filter((r) => r.variable === v && r.scenario === 'NetZero');
    if (nzRows.length) {
      series.push({
        name: `${meta.label} (NetZero 전망)`,
        type: 'line',
        data: years.map((y) => nzRows.find((r) => r.year === y)?.value ?? null),
        lineStyle: { color: meta.color, width: 2.5, type: 'dashed' },
        itemStyle: { color: meta.color },
        symbol: 'circle',
        symbolSize: 5,
        connectNulls: false,
      });
    }
  }

  // Grid Parity zone annotation (will show when data crosses)
  const hasProjection = rows.some((r) => r.scenario === 'NetZero');

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { seriesName: string; value: number | null; axisValue: string }[]) => {
        if (!params.length) return '';
        const year = params[0].axisValue;
        const lines = params
          .filter((p) => p.value != null)
          .map((p) => `${p.seriesName}: <b>${(p.value as number).toFixed(1)} USD/MWh</b>`);
        return `<div class="text-xs"><div class="font-semibold mb-1">${year}년</div>${lines.join('<br/>')}</div>`;
      },
    },
    legend: { bottom: 0 },
    grid: { left: 70, right: 20, bottom: 60, top: 20 },
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: 'USD/MWh',
      nameLocation: 'middle',
      nameGap: 55,
    },
    series,
  };

  return (
    <div>
      {!hasProjection && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          ⚠️ 현재 2020~2022년 실적 데이터만 있습니다. 그리드 패리티 교차점은 KEI팀 전망치 제출 후 표시됩니다.
        </div>
      )}
      <p className="mb-2 text-center text-xs text-slate-400">
        석탄 LCOE와 태양광 LCOE가 교차하는 시점 = 그리드 패리티 달성
      </p>
      <ReactECharts option={option} style={{ height: 380 }} notMerge />

      {/* Current trend note */}
      <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        <b>그리드 패리티(Grid Parity):</b> 재생에너지 발전단가가 화석연료와 같아지는 시점.
        태양광 LCOE는 기술 혁신으로 지속 하락 중이며, 석탄 LCOE는 탄소세 부과로 상승 예상.
        NEtZero 시나리오에서 두 곡선의 교차 연도가 핵심 지표입니다.
      </div>
    </div>
  );
}
