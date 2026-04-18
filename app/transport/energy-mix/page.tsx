import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { TransportEnergyMixChart } from './TransportEnergyMixChart';

const FILE = 'data/transport/SMU_Trip_20260416.xlsx';

export default async function EnergyMixPage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Energy');
  const rows = sheet.rows.filter((r) => r.region === 'KOR');

  return (
    <UniconCard
      title="차종별 에너지원 믹스"
      subtitle="단위: ktoe"
      source={`${FILE} · Table_Transport_Energy`}
    >
      <TransportEnergyMixChart rows={rows} scenarios={sheet.scenarios} />
    </UniconCard>
  );
}
