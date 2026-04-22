import { loadForestData } from '@/lib/forest/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { ForestAnnualFluxChart } from './ForestAnnualFluxChart';

export default async function AnnualFluxPage() {
  const rows = await loadForestData();
  const chartRows = rows.filter((r) => r.variable === 'Emissions|CO2|Land Use|Forestry');

  return (
    <UniconCard
      title="연간 순흡수량"
      subtitle="산림부문 연간 CO₂ 순흡수량 (단위: Mt CO₂/yr, 음수 = 흡수) — 권역별 BAU / NetZero"
      source="data/forest/02_IAMC_Reports/Final_Comparison_All_Scenarios.csv"
    >
      <ForestAnnualFluxChart rows={chartRows} />
    </UniconCard>
  );
}
