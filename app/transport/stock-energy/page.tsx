import { loadIamcSheet } from '@/lib/iamc/load';
import { TransportStockChart } from './TransportStockChart';

const FILE = 'data/transport/SMU_Trip_20260411.xlsx';

export default async function StockEnergyPage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Stock');
  const rows = sheet.rows.filter((r) => r.region === 'KOR');

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <TransportStockChart rows={rows} scenarios={sheet.scenarios} />
      </div>
      <p className="text-xs text-slate-400">Source: {FILE} · Table_Transport_Stock</p>
    </div>
  );
}
