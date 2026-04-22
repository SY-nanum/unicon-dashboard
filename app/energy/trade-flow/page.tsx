import { loadYonseiTradeSheet } from '@/lib/energy/loadYonseiTrade';
import { UniconCard } from '@/components/ui/UniconCard';
import { EnergyTradeFlowChart } from './EnergyTradeFlowChart';

const FILE = 'data/energy/KEI_Power_Yonsei_V2.xlsx';

export default async function TradeFlowPage() {
  const sheet = await loadYonseiTradeSheet(FILE);

  return (
    <UniconCard
      title="동북아 전력 융통량"
      subtitle="KOR↔JPN · KOR↔CHN 전력 교역량 전망 (단위: GWh/yr) — NetZero 시나리오"
      source={`${FILE} · 연세_TRADE 탭`}
    >
      <EnergyTradeFlowChart annual={sheet.annual} years={sheet.years} />
    </UniconCard>
  );
}
