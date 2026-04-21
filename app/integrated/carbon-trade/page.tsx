import { loadIamcSheet } from '@/lib/iamc/load';
import { UniconCard } from '@/components/ui/UniconCard';
import { IntCarbonTradeChart } from './IntCarbonTradeChart';

const FILE = 'data/integrate/YONSEI_Int_Submission(260421_1435).xlsx';
const SHEET_MACRO = 'Table_Macro_Climate';
const SHEET_TRADE = 'Table_Trade_Damage';

export default async function CarbonTradePage() {
  const [macroSheet, tradeSheet] = await Promise.all([
    loadIamcSheet(FILE, SHEET_MACRO),
    loadIamcSheet(FILE, SHEET_TRADE),
  ]);

  // Carbon price (JPK region — model aggregation for Japan+Korea)
  const carbonRows = macroSheet.rows.filter(
    (r) => r.variable === 'Price|Carbon' && r.region === 'JPK',
  );

  // Trade export (KOR)
  const tradeRows = tradeSheet.rows.filter(
    (r) => r.variable === 'Trade|Export|Total' && r.region === 'KOR',
  );

  return (
    <UniconCard
      title="탄소 가격 및 무역 변화"
      subtitle="탄소 가격 경로 (JPK 지역) 및 한국 수출 전망"
      source={`${FILE} · ${SHEET_MACRO}, ${SHEET_TRADE}`}
    >
      <IntCarbonTradeChart carbonRows={carbonRows} tradeRows={tradeRows} />
    </UniconCard>
  );
}
