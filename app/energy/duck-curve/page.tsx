import { loadYonseiSheet } from '@/lib/energy/loadYonsei';
import { UniconCard } from '@/components/ui/UniconCard';
import { EnergyDuckChart } from './EnergyDuckChart';

const FILE = 'data/energy/KEI_Power_Yonsei_V2.xlsx';

export default async function DuckCurvePage() {
  const sheet = await loadYonseiSheet(FILE);

  // Serialise to plain object (avoids Next.js "non-serialisable" warning)
  const rows = sheet.rows.map((r) => ({
    tsIndex: r.tsIndex,
    season:  r.season,
    hour:    r.hour,
    item:    r.item,
    year:    r.year,
    value:   r.value,
  }));

  return (
    <UniconCard
      title="시간대별 전력수급 현황 (Duck Curve)"
      subtitle="UNICON POWER&CGE 모형: 순부하·태양광·총수요 24시간 프로파일 (단위: GW)"
      source={`${FILE} · 연세_hourly 탭 (3년 단위 시뮬레이션)`}
    >
      <EnergyDuckChart
        rows={rows}
        years={sheet.years}
        seasons={sheet.seasons}
      />
    </UniconCard>
  );
}
