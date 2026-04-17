import { loadIamcSheet } from '@/lib/iamc/load';
import { TransportEnergyMixChart } from './TransportEnergyMixChart';

const FILE = 'data/transport/SMU_Trip_20260416.xlsx';

export default async function EnergyMixPage() {
  const sheet = await loadIamcSheet(FILE, 'Table_Transport_Energy');
  const rows = sheet.rows.filter((r) => r.region === 'KOR');

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <TransportEnergyMixChart rows={rows} scenarios={sheet.scenarios} />
      </div>
      <p className="text-xs text-slate-400">Source: {FILE} · Table_Transport_Energy</p>
    </div>
  );
}
