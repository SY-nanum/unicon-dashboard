import { loadIamcSheet } from '@/lib/iamc/load';
import { TransportGhgChart } from './TransportGhgChart';

const FILE = 'data/transport/SMU_Trip_20260416.xlsx';

export default async function GhgTrendPage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Energy');
  const rows = sheet.rows.filter(
    (r) => r.region === 'KOR' && r.variable === 'Emissions|CO2|Transportation|Total'
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <TransportGhgChart rows={rows} scenarios={sheet.scenarios} />
      </div>
      <p className="text-xs text-slate-400">Source: {FILE} · Table_Transport_Energy</p>
    </div>
  );
}
