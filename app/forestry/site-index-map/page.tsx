import { UniconCard } from '@/components/ui/UniconCard';

export default function SiteIndexMapPage() {
  return (
    <UniconCard
      title="지위지수지도"
      subtitle="국가별 산림 토지 생산성 지도 — Site Index (GeoTIFF)"
      source="data/forest/GeoTIFF_Outputs/{ISO3}_2050_Dashboard.tif · data/forest/Historical/{ISO3}_17Band_Historical.tif"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p className="font-semibold">지위지수(Site Index)란?</p>
          <p className="mt-1 text-xs">
            특정 기준 수령(50년)에서의 우세목 수고(m)로 표현되는 산림 토지 생산성 지표.
            지위지수가 높을수록 산림의 탄소흡수 잠재력이 높습니다.
          </p>
        </div>

        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-green-200 bg-green-50 text-slate-500">
          <span className="text-5xl">🗺️</span>
          <p className="text-base font-medium text-green-700">지위지수 GeoTIFF 지도</p>
          <p className="max-w-md text-center text-sm">
            국가별 래스터 지위지수 지도는 <code className="rounded bg-green-100 px-1">GeoTIFF_Outputs/</code> 및
            <code className="rounded bg-green-100 px-1"> Historical/</code> 디렉토리의 TIF 파일로 제공됩니다.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="mb-2 font-semibold text-slate-700">📁 데이터 파일 구조</p>
          <div className="space-y-1 font-mono">
            <p>data/forest/GeoTIFF_Outputs/<br />
              &nbsp;&nbsp;{'{ISO3}'}_2050_Dashboard.tif &nbsp;— 국가별 2050년 전망 (150+ 국가)</p>
            <p>data/forest/Historical/<br />
              &nbsp;&nbsp;{'{ISO3}'}_17Band_Historical.tif — 17개 밴드 실측 데이터</p>
          </div>
          <p className="mt-3 text-slate-500">
            GIS 렌더링 파이프라인(geotiff.js + MapLibre GL) 구축 후 인터랙티브 지도로 시각화 예정입니다.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '한국 (KOR)', val: '—', note: 'KOR_2050_Dashboard.tif' },
            { label: '일본 (JPN)', val: '—', note: 'JPN_2050_Dashboard.tif' },
            { label: '중국 (CHN)', val: '—', note: 'CHN_2050_Dashboard.tif' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-green-200 bg-white p-3 text-center">
              <p className="text-xs font-medium text-slate-700">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{item.val}</p>
              <p className="mt-0.5 text-xs text-slate-400">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </UniconCard>
  );
}
