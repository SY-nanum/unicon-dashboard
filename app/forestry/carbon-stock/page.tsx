import { loadForestData } from '@/lib/forest/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { ForestCarbonStockChart } from './ForestCarbonStockChart';

export default async function CarbonStockPage() {
  const rows = await loadForestData();
  const chartRows = rows.filter((r) => r.variable === 'Carbon Stock|Forest|Total');

  return (
    <UniconCard
      title="국가별 탄소저장량 추이"
      subtitle="산림 탄소저장량 전망 (단위: Mt C) — 권역별 BAU / NetZero 시나리오"
      source="data/forest/02_IAMC_Reports/Final_Comparison_All_Scenarios.csv"
    >
      <ForestCarbonStockChart rows={chartRows} />
    </UniconCard>
  );
}
