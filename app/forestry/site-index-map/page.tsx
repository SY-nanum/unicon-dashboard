import { UniconCard } from '@/components/ui/UniconCard';
import { ForestSiteIndexChart } from './ForestSiteIndexChart';

export default function SiteIndexMapPage() {
  return (
    <UniconCard
      title="지위지수 지도"
      subtitle="국가별 산림 지위지수 (Siteindex_m) — GeoTIFF Historical Band 17"
      source="data/forest/GeoTIFF_Historical/{COUNTRY}_17Band_Historical.tif · Band 17 · public/maps/meta.json"
    >
      <ForestSiteIndexChart />
    </UniconCard>
  );
}
