import { loadForestData } from '@/lib/forest/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { ForestBiomassChart } from './ForestBiomassChart';

export default async function BiomassMapPage() {
  const rows = await loadForestData();
  const chartRows = rows.filter((r) => r.variable === 'Carbon Stock|Forest|Total');

  return (
    <UniconCard
      title="산림바이오매스지도"
      subtitle="권역별 산림 탄소저장량 비교 (단위: Mt C) — 바이오매스 대리 지표"
      source="data/forest/02_IAMC_Reports/Final_Comparison_All_Scenarios.csv · GeoTIFF_Outputs/"
    >
      <ForestBiomassChart rows={chartRows} />
    </UniconCard>
  );
}
