import { loadIamcSheet } from '@/lib/iamc/load';
import { ScenarioOverlay } from '@/components/charts/ScenarioOverlay';
import { MultiLineChart } from '@/components/charts/MultiLineChart';

const FILE = 'data/transport/SMU_Trip_20260411.xlsx';
const SCENARIO_COLORS: Record<string, string> = {
  Historical: '#64748b',
  BAU:        '#ef4444',
  NetZero:    '#10b981',
};

export default async function GhgTrendPage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Energy');
  const rows = sheet.rows.filter(
    (r) => r.region === 'KOR' && r.variable === 'Emissions|CO2|Transportation|Total',
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 text-center">온실가스 배출 추이</h2>
        <p className="py-12 text-center text-slate-400">데이터 준비 중</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 text-center">온실가스 배출 추이</h2>
        <p className="mt-1 text-sm text-slate-500 text-center">KOR · Emissions|CO2|Transportation|Total</p>
        <ScenarioOverlay rows={rows} availableScenarios={sheet.scenarios} max={3}>
          {(filtered) => (
            <MultiLineChart
              rows={filtered}
              groupKey="scenario"
              groupColors={SCENARIO_COLORS}
              yAxisLabel="배출량 (ktCO₂)"
            />
          )}
        </ScenarioOverlay>
      </div>
      <p className="text-xs text-slate-400">Source: {FILE} · Table_Transport_Energy</p>
    </div>
  );
}
