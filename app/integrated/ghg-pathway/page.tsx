import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { IntGhgPathwayChart } from './IntGhgPathwayChart';

const FILE = 'data/integrate/YONSEI_Int_Submission(260421_1435).xlsx';
const SHEET = 'Table_Macro_Climate';

export default async function GhgPathwayPage() {
  const sheet = await loadIamcSheet(FILE, SHEET);

  // Global total GHG (projection scenarios)
  const globalRows = sheet.rows.filter(
    (r) => r.variable === 'Emissions|GHG|Total' && r.region === 'Global',
  );
  // KOR historical GHG (real data)
  const korHistRows = sheet.rows.filter(
    (r) =>
      r.variable === 'Emissions|GHG|Total' &&
      r.region === 'KOR' &&
      r.scenario === 'Historical',
  );

  return (
    <UniconCard
      title="글로벌 GHG 감축 경로"
      subtitle="글로벌 온실가스 배출 추이 및 시나리오별 전망 (단위: Mt CO₂eq)"
      source={`${FILE} · ${SHEET}`}
    >
      <IntGhgPathwayChart globalRows={globalRows} korHistRows={korHistRows} />
    </UniconCard>
  );
}
