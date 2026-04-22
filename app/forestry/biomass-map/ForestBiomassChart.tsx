'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ForestRow } from '@/lib/forest/load';
import { REGION_LABELS, REGION_ORDER } from '@/lib/forest/meta';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props { rows: ForestRow[] }

const SCENARIO_COLORS = { BAU: '#dc2626', NetZero: '#059669', Historical: '#64748b' };
const TARGET_YEARS = [2020, 2030, 2040, 2050];

export function ForestBiomassChart({ rows }: Props) {
  const [selectedYear, setSelectedYear] = useState(2050);
  const [selectedScenario, setSelectedScenario] = useState<'BAU' | 'NetZero'>('NetZero');

  const displayScenario = selectedYear <= 2020 ? 'Historical' : selectedScenario;

  const yearData = REGION_ORDER.map((region) => {
    const row = rows.find(
      (r) =>
        r.region === region &&
        r.year === selectedYear &&
        r.scenario === (selectedYear <= 2020 ? 'Historical' : selectedScenario),
    );
    return { region, label: REGION_LABELS[region] ?? region, value: row?.value ?? 0 };
  }).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: { value: number; name: string }[]) => {
        if (!params.length) return '';
        const { name, value } = params[0];
        return `<b>${name}</b><br/>탄소저장량: <b>${value.toFixed(1)} Mt C</b>`;
      },
    },
    grid: { left: 120, right: 60, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      name: 'Mt C',
      nameLocation: 'end',
    },
    yAxis: {
      type: 'category',
      data: yearData.map((d) => d.label),
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: yearData.map((d) => ({
          value: d.value,
          itemStyle: {
            color:
              displayScenario === 'NetZero'
                ? '#059669'
                : displayScenario === 'BAU'
                  ? '#dc2626'
                  : '#64748b',
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (p: { value: number }) => `${p.value.toFixed(0)}`,
          fontSize: 10,
        },
        barMaxWidth: 30,
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
        ⚠️ 공간 바이오매스 지도 데이터(GeoTIFF)는 국가별 래스터 파일로 제공되며, 현재 대시보드에서는
        권역 집계 탄소저장량을 바이오매스 대리 지표로 시각화합니다.
        국가별 세부 지도는 GIS 렌더링 파이프라인 구축 후 제공 예정입니다.
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
        <b>산림 탄소저장량 (바이오매스 대리 지표):</b> 산림 생물체에 저장된 탄소의 총량.
        중남미·러시아·캐나다 등 대규모 산림 권역이 글로벌 탄소저장고 역할을 담당합니다.
        국가별 상세 바이오매스 분포는 GeoTIFF 파일({'{ISO3}'}_2050_Dashboard.tif)에 저장되어 있습니다.
      </div>
    </div>
  );
}
