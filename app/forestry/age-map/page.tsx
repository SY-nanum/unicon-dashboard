import { loadForestData } from '@/lib/forest/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { ForestAgeMapChart } from './ForestAgeMapChart';

export default async function AgeMapPage() {
  const rows = await loadForestData();
  const chartRows = rows.filter((r) => r.variable.startsWith('Area|Forest|Age Class'));

  return (
    <UniconCard
      title="임령지도"
      subtitle="권역별 영급구조 분포 (단위: Million ha) — 2050년 시나리오 비교"
      source="data/forest/02_IAMC_Reports/Final_Comparison_All_Scenarios.csv · GeoTIFF_Outputs/"
    >
      <ForestAgeMapChart rows={chartRows} />
    </UniconCard>
  );
}
