import { loadYonseiAnnualSheet } from '@/lib/energy/loadYonseiAnnual';
import { UniconCard } from '@/components/ui/UniconCard';
import { EnergyPowerMixChart } from './EnergyPowerMixChart';

const FILE = 'data/energy/KEI_Power_Yonsei_V2.xlsx';

export default async function PowerMixPage() {
  const sheet = await loadYonseiAnnualSheet(FILE);

  const genmixRows = sheet.rows.filter((r) => r.region === 'KOR' && r.item === 'genmix');
  const capmixRows = sheet.rows.filter((r) => r.region === 'KOR' && r.item === 'capmix');

  return (
    <UniconCard
      title="연도별 전원 믹스"
      subtitle="UNICON POWER&CGE 모형: 전원별 발전량(TWh) / 설비용량(GW) — NetZero 시나리오"
      source={`${FILE} · 연세_annual 탭`}
    >
      <EnergyPowerMixChart
        genmixRows={genmixRows}
        capmixRows={capmixRows}
        years={sheet.years}
      />
    </UniconCard>
  );
}
