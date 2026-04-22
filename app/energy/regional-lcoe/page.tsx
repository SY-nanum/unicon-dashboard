import { UniconCard } from '@/components/ui/UniconCard';

export default function RegionalLcoePage() {
  return (
    <UniconCard
      title="지역별 발전단가"
      subtitle="권역별 전력 도매가격 평균 (USD/MWh) — NetZero 시나리오"
      source="data/energy/KEI_Power_Yonsei.xlsx · Table_Power_Annual"
    >
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-400">
        <span className="text-5xl">💡</span>
        <p className="text-base font-medium text-slate-500">지역별 발전단가 비교</p>
        <p className="text-sm">Price|Electricity|Regional|Average 전망 데이터 제출 대기 중</p>
        <p className="max-w-sm text-center text-xs text-slate-400">
          KEI팀의 권역별 도매 전력가격(USD/MWh) NetZero 전망치 제출 후<br />
          시계열 막대 및 선 그래프로 시각화됩니다.
        </p>
      </div>
    </UniconCard>
  );
}
