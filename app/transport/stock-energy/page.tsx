import { loadIamcSheet } from '@/lib/iamc/load';
import { ScenarioOverlay } from '@/components/charts/ScenarioOverlay';
import { StackedBar } from '@/components/charts/StackedBar';

const FILE = 'data/transport/SMU_Trip_20260411.xlsx';
const PT_COLORS: Record<string, string> = {
  '내연기관(ICEV)': '#94a3b8',
  '전기차(BEV)':    '#3b82f6',
  '수소차(FCEV)':   '#10b981',
};
const VAR_TO_LABEL: Record<string, string> = {
  'Stock|Transportation|Total|ICEV':    '내연기관(ICEV)',
  'Stock|Transportation|Total|BEV':     '전기차(BEV)',
  'Stock|Transportation|Freight|FCEV':  '수소차(FCEV)',
};

export default async function StockEnergyPage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Stock');
  const rows = sheet.rows
    .filter((r) => r.region === 'KOR' && r.variable in VAR_TO_LABEL)
    .map((r) => ({ ...r, variable: VAR_TO_LABEL[r.variable] }));

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 text-center">파워트레인별 차량 보급 대수 및 총 에너지 수요</h2>
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
              title="파워트레인별 차량 보급 대수 및 총 에너지 수요"
              rows={filtered}
              stackKey="variable"
              stackColors={PT_COLORS}
              yAxisLabel="대수 (천대)"
            />
          )}
        </ScenarioOverlay>
      </div>
      <p className="text-xs text-slate-400">Source: {FILE} · Table_Transport_Stock</p>
    </div>
  );
}
