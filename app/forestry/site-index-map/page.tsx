import { loadForestData } from '@/lib/forest/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { ForestSiteIndexChart } from './ForestSiteIndexChart';

export default async function SiteIndexMapPage() {
  const rows = await loadForestData();
  const stockRows = rows.filter((r) => r.variable === 'Carbon Stock|Forest|Total');
  const areaRows  = rows.filter((r) => r.variable.startsWith('Area|Forest|Age Class|'));

  return (
    <UniconCard
      title="지위지수지도"
      subtitle="권역별 산림 탄소밀도 (t C/ha) — 지위지수 대리지표"
      source="data/forest/02_IAMC_Reports/Final_Comparison_All_Scenarios.csv · GeoTIFF_Outputs/"
    >
      <ForestSiteIndexChart stockRows={stockRows} areaRows={areaRows} />
    </UniconCard>
  );
}
