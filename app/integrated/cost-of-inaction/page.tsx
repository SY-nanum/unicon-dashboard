import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { IntCostChart } from './IntCostChart';

const FILE = 'data/integrate/YONSEI_Int_Submission(260421_1435).xlsx';
const SHEET = 'Table_Macro_Climate';

export default async function CostOfInactionPage() {
  const sheet = await loadIamcSheet(FILE, SHEET);
  const rows = sheet.rows.filter(
    (r) => r.variable === 'GDP|Real' && r.region === 'KOR',
  );

  return (
    <UniconCard
      title="기후 피해 비용 비교"
      subtitle="한국 실질 GDP: 피해 미반영(BAU) vs 피해 반영(Damage) 시나리오 (단위: Billion USD)"
      source={`${FILE} · ${SHEET}`}
    >
      <IntCostChart rows={rows} />
    </UniconCard>
  );
}
