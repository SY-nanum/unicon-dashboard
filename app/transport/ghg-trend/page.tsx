import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { TransportGhgChart } from './TransportGhgChart';

const FILE = 'data/transport/SMU_Trip_20260416.xlsx';

export default async function GhgTrendPage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Energy');
  const rows = sheet.rows.filter(
    (r) => r.region === 'KOR' && r.variable === 'Emissions|CO2|Transportation|Total'
  );

  return (
    <UniconCard
      title="온실가스 배출 추이"
      subtitle="단위: Mt CO₂eq"
      source={`${FILE} · Table_Transport_Energy`}
    >
      <TransportGhgChart rows={rows} scenarios={sheet.scenarios} />
    </UniconCard>
  );
}
