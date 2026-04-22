import { loadForestData } from '@/lib/forest/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { ForestAgeClassChart } from './ForestAgeClassChart';

export default async function AgeClassPage() {
  const rows = await loadForestData();
  const chartRows = rows.filter((r) => r.variable.startsWith('Area|Forest|Age Class'));

  return (
    <UniconCard
      title="영급구조 변화"
      subtitle="수령별 산림면적 구성 (단위: Million ha) — 권역별 시나리오 비교"
      source="data/forest/02_IAMC_Reports/Final_Comparison_All_Scenarios.csv"
    >
      <ForestAgeClassChart rows={chartRows} />
    </UniconCard>
  );
}
