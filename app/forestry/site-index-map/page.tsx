import { loadForestData } from '@/lib/forest/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { ForestSiteIndexChart } from './ForestSiteIndexChart';

export default async function SiteIndexMapPage() {
  const rows = await loadForestData();
  const stockRows = rows.filter((r) => r.variable === 'Carbon Stock|Forest|Total');
  const areaRows  = rows.filter((r) => r.variable.startsWith('Area|Forest|Age Class|'));

  return (
    <UniconCard
      title="산림 탄소밀도"
      subtitle="권역별 단위면적당 탄소저장량 (t C/ha)"
      source="data/forest/02_IAMC_Reports/Final_Comparison_All_Scenarios.csv · GeoTIFF_Outputs/"
    >
      <ForestSiteIndexChart stockRows={stockRows} areaRows={areaRows} />
    </UniconCard>
  );
}
