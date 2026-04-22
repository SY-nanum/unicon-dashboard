import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { EnergyLcoeChart } from './EnergyLcoeChart';

const FILE = 'data/energy/KEI_Power_Yonsei_V2.xlsx';
const SHEET = 'Table_Power_Annual';

export default async function LcoePage() {
  const sheet = await loadIamcSheet(FILE, SHEET);

  const lcoeVars = [
    'Price|Electricity|Coal|LCOE',
    'Price|Electricity|Solar|LCOE',
  ];

  const rows = sheet.rows.filter(
    (r) => r.region === 'KOR' && lcoeVars.includes(r.variable),
  );

  return (
    <UniconCard
      title="LCOE 및 그리드 패리티"
      subtitle="균등화 발전단가 비교: 석탄(탄소세 반영) vs 태양광 (단위: USD/MWh)"
      source={`${FILE} · ${SHEET}`}
    >
      <EnergyLcoeChart rows={rows} />
    </UniconCard>
  );
}
