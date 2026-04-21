import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { IntTemperatureChart } from './IntTemperatureChart';

const FILE = 'data/integrate/YONSEI_Int_Submission(260421_1435).xlsx';
const SHEET = 'Table_Macro_Climate';

export default async function TemperaturePage() {
  const sheet = await loadIamcSheet(FILE, SHEET);
  const rows = sheet.rows.filter(
    (r) => r.variable === 'Temperature|Anomaly' && r.region === 'Global',
  );

  return (
    <UniconCard
      title="기온 상승 경로"
      subtitle="산업화 이전 대비 지구 평균 기온 상승폭 (단위: °C)"
      source={`${FILE} · ${SHEET}`}
    >
      <IntTemperatureChart rows={rows} />
    </UniconCard>
  );
}
