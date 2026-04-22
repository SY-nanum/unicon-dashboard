import { UniconCard } from '@/components/ui/UniconCard';

export default function TradeFlowPage() {
  return (
    <UniconCard
      title="동북아 전력 융통량"
      subtitle="국가 간 전력 수출입 (GWh) — NetZero 시나리오"
      source="data/energy/KEI_Power_Yonsei.xlsx · Table_Power_Annual"
    >
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-400">
        <span className="text-5xl">🗺️</span>
        <p className="text-base font-medium text-slate-500">동북아 전력 융통량 맵</p>
        <p className="text-sm">Trade|Electricity|Flow 전망 데이터 제출 대기 중</p>
        <p className="max-w-sm text-center text-xs text-slate-400">
          KEI팀의 NetZero 시나리오 KOR↔JPN, CHN↔KOR 전력 교역량 전망치 제출 후<br />
          지도 위 화살표 굵기로 시각화됩니다.
        </p>
      </div>
    </UniconCard>
  );
}
