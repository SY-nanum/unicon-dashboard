import { loadIamcSheet } from '@/lib/iamc/load';
import { ScenarioOverlay } from '@/components/charts/ScenarioOverlay';
import { StackedBar } from '@/components/charts/StackedBar';

const FILE = 'data/transport/SMU_Trip_20260411.xlsx';
const VAR_TO_LABEL: Record<string, string> = {
  'Final Energy|Transportation|Passenger|Liquids': '승용 액체연료',
  'Final Energy|Transportation|Bus|Liquids':       '버스 액체연료',
  'Final Energy|Transportation|Bus|Electricity':   '버스 전기',
  'Final Energy|Transportation|Freight|Electricity': '화물 전기',
};
const ENERGY_COLORS: Record<string, string> = {
  '승용 액체연료': '#94a3b8',
  '버스 액체연료': '#fb923c',
  '버스 전기':     '#3b82f6',
  '화물 전기':     '#10b981',
};

export default async function EnergyMixPage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Energy');
  const rows = sheet.rows
    .filter((r) => r.region === 'KOR' && r.variable in VAR_TO_LABEL)
    .map((r) => ({ ...r, variable: VAR_TO_LABEL[r.variable] }));

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 text-center">차종별 에너지원 믹스</h2>
        <p className="py-12 text-center text-slate-400">데이터 준비 중</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ScenarioOverlay rows={rows} availableScenarios={sheet.scenarios}>
          {(filtered) => (
            <StackedBar
              title="차종별 에너지원 믹스"
              rows={filtered}
              stackKey="variable"
              stackColors={ENERGY_COLORS}
              yAxisLabel="에너지 (ktoe)"
            />
          )}
        </ScenarioOverlay>
      </div>
      <p className="text-xs text-slate-400">Source: {FILE} · Table_Transport_Energy</p>
    </div>
  );
}
