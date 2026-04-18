import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { TransportStockShareChart } from './TransportStockShareChart';

const FILE = 'data/transport/SMU_Trip_20260416.xlsx';

export default async function StockSharePage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Stock');
  const rows = sheet.rows.filter((r) => r.region === 'KOR');

  return (
    <UniconCard
      title="파워트레인별 차량 등록대수 구성비"
      subtitle="단위: % (비율)"
      source={`${FILE} · Table_Transport_Stock`}
    >
      <TransportStockShareChart rows={rows} scenarios={sheet.scenarios} />
    </UniconCard>
  );
}
