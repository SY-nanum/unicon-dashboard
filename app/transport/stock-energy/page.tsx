import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { TransportStockChart } from './TransportStockChart';

const FILE = 'data/transport/SMU_Trip_20260416.xlsx';

export default async function StockEnergyPage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Stock');
  const rows = sheet.rows.filter((r) => r.region === 'KOR');

  return (
    <UniconCard
      title="파워트레인별 차량 보급 대수 및 총 에너지 수요"
      subtitle="단위: 천 대 (Thousand vehicles)"
      source={`${FILE} · Table_Transport_Stock`}
    >
      <TransportStockChart rows={rows} scenarios={sheet.scenarios} />
    </UniconCard>
  );
}
