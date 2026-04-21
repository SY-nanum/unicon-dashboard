import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { IntDamageChart } from './IntDamageChart';

const FILE = 'data/integrate/YONSEI_Int_Submission(260421_1435).xlsx';
const SHEET = 'Table_Trade_Damage';

const DAMAGE_VARIABLES = [
  'Damage|Agriculture',
  'Damage|Labor',
  'Damage|Tourism',
  'Damage|Energy',
];

export default async function DamageHeatmapPage() {
  const sheet = await loadIamcSheet(FILE, SHEET);
  const rows = sheet.rows.filter(
    (r) =>
      DAMAGE_VARIABLES.includes(r.variable) &&
      r.region === 'KOR',
  );

  return (
    <UniconCard
      title="부문별 피해 상세"
      subtitle="기후변화로 인한 한국 부문별 피해율 (기준 대비 %, SSP5-8.5 시나리오)"
      source={`${FILE} · ${SHEET}`}
    >
      <IntDamageChart rows={rows} />
    </UniconCard>
  );
}
