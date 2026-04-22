import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { EnergyPowerMixChart } from './EnergyPowerMixChart';

const FILE = 'data/energy/KEI_Power_Yonsei.xlsx';
const SHEET = 'Table_Power_Annual';

export default async function PowerMixPage() {
  const sheet = await loadIamcSheet(FILE, SHEET);

  // Generation mix variables
  const genVars = [
    'Secondary Energy|Electricity|Coal',
    'Secondary Energy|Electricity|Solar',
    'Secondary Energy|Electricity|Total',
  ];

  const rows = sheet.rows.filter(
    (r) => r.region === 'KOR' && genVars.includes(r.variable),
  );

  return (
    <UniconCard
      title="연도별 전원 믹스"
      subtitle="한국 전원별 발전량 (단위: TWh) — Historical 실적 + NetZero 전망"
      source={`${FILE} · ${SHEET}`}
    >
      <EnergyPowerMixChart rows={rows} />
    </UniconCard>
  );
}
