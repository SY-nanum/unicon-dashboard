// UNICON dashboard sector + chart metadata.
// Chart titles per "UNICON 통합모형 시각화 방안 v2.1 (수송 숙대의견반영).docx" §2-8.

export interface ChartMeta {
  slug: string;
  title: string;
  /** If false, renders a placeholder page */
  implemented?: boolean;
}

export interface SectorMeta {
  slug: string;
  name: string;
  color: string;
  icon: string;
  charts: ChartMeta[];
}

export const SECTORS: SectorMeta[] = [
  {
    slug: 'integrated',
    name: '통합',
    color: 'purple',
    icon: '🌐',
    charts: [
      { slug: 'cost-of-inaction', title: '기후 피해 비용\n비교', implemented: true },
      { slug: 'ghg-pathway', title: '글로벌 GHG\n감축 경로', implemented: true },
      { slug: 'carbon-trade', title: '탄소 가격 및\n무역 변화', implemented: true },
      { slug: 'temperature', title: '기온 상승\n경로', implemented: true },
      { slug: 'damage-heatmap', title: '부문별\n피해 상세', implemented: true },
    ],
  },
  {
    slug: 'energy',
    name: '에너지',
    color: 'amber',
    icon: '⚡',
    charts: [
      { slug: 'power-mix', title: '연도별\n전원 믹스', implemented: true },
      { slug: 'duck-curve', title: '시간대별 전력수급 현황\n(Duck Curve 포함)', implemented: true },
      { slug: 'lcoe', title: 'LCOE 및\n그리드 패리티', implemented: true },
      { slug: 'trade-flow', title: '동북아\n전력 융통량', implemented: true },
      { slug: 'regional-lcoe', title: '지역별\n발전단가', implemented: true },
    ],
  },
  {
    slug: 'transport',
    name: '수송',
    color: 'blue',
    icon: '🚗',
    charts: [
      { slug: 'stock-energy', title: '파워트레인별 차량 보급\n대수 및 총 에너지 수요', implemented: true },
      { slug: 'stock-share', title: '파워트레인별 차량\n등록대수 구성비', implemented: true },
      { slug: 'energy-mix', title: '차종별\n에너지원 믹스', implemented: true },
      { slug: 'ghg-trend', title: '온실가스\n배출 추이', implemented: true },
    ],
  },
  {
    slug: 'industry',
    name: '산업',
    color: 'red',
    icon: '🏭',
    charts: [
      { slug: 'reduction-contribution', title: '철강 탄소 감축\n기여도', implemented: true },
      { slug: 'process-mix', title: '공정 기술\n점유율 변화', implemented: true },
      { slug: 'energy-intensity', title: '에너지 집약도 및\n소비 구조', implemented: true },
      { slug: 'capex', title: '전환 투자비용\n구조', implemented: true },
      { slug: 'cbam', title: 'CBAM 경쟁력\n진단', implemented: true },
    ],
  },
  {
    slug: 'building',
    name: '건물',
    color: 'teal',
    icon: '🏢',
    charts: [
      { slug: 'energy-by-source', title: '에너지원별\n소비량' },
      { slug: 'eui', title: '서비스별 EUI\n(Energy Use Intensity)' },
      { slug: 'reduction', title: '감축\n기여도' },
      { slug: 'hdd-cdd', title: 'HDD\n/CDD' },
      { slug: 'floor-area', title: '건물 연면적\n전망' },
    ],
  },
  {
    slug: 'forestry',
    name: '산림',
    color: 'green',
    icon: '🌲',
    charts: [
      { slug: 'biomass-map', title: '산림바이오\n매스지도', implemented: true },
      { slug: 'carbon-stock', title: '국가별탄소\n저장량추이', implemented: true },
      { slug: 'age-class', title: '영급구조\n변화', implemented: true },
      { slug: 'age-map', title: '임령\n지도', implemented: true },
      { slug: 'site-index-map', title: '지위지수\n지도', implemented: true },
      { slug: 'annual-flux', title: '연간\n순흡수량', implemented: true },
    ],
  },
];

export function findSector(slug: string): SectorMeta | undefined {
  return SECTORS.find((s) => s.slug === slug);
}

export function findChart(sectorSlug: string, chartSlug: string): ChartMeta | undefined {
  return findSector(sectorSlug)?.charts.find((c) => c.slug === chartSlug);
}

/** Tailwind class tokens keyed by sector color (explicit strings so Tailwind JIT keeps them). */
export const SECTOR_COLOR_CLASSES: Record<
  string,
  {
    /** Active tile — solid colored bg + white text (역상) */
    tileActiveBg: string;
    /** Inactive tile — outlined rectangle (colored border, transparent bg, black text) */
    tileInactiveBorder: string;
    tileInactiveHoverBg: string;
    /** Chart tab + accents */
    accent: string;
    dot: string;
    tabActiveBg: string;
    activeText: string;
  }
> = {
  purple: {
    tileActiveBg: 'bg-purple-600',
    tileInactiveBorder: 'border-purple-500', tileInactiveHoverBg: 'hover:bg-purple-50',
    accent: 'text-purple-600', dot: 'bg-purple-500', tabActiveBg: 'bg-purple-100', activeText: 'text-purple-900',
  },
  amber: {
    tileActiveBg: 'bg-amber-500',
    tileInactiveBorder: 'border-amber-500', tileInactiveHoverBg: 'hover:bg-amber-50',
    accent: 'text-amber-600', dot: 'bg-amber-500', tabActiveBg: 'bg-amber-100', activeText: 'text-amber-900',
  },
  blue: {
    tileActiveBg: 'bg-blue-600',
    tileInactiveBorder: 'border-blue-500', tileInactiveHoverBg: 'hover:bg-blue-50',
    accent: 'text-blue-600', dot: 'bg-blue-500', tabActiveBg: 'bg-blue-100', activeText: 'text-blue-900',
  },
  red: {
    tileActiveBg: 'bg-red-600',
    tileInactiveBorder: 'border-red-500', tileInactiveHoverBg: 'hover:bg-red-50',
    accent: 'text-red-600', dot: 'bg-red-500', tabActiveBg: 'bg-red-100', activeText: 'text-red-900',
  },
  teal: {
    tileActiveBg: 'bg-teal-600',
    tileInactiveBorder: 'border-teal-500', tileInactiveHoverBg: 'hover:bg-teal-50',
    accent: 'text-teal-600', dot: 'bg-teal-500', tabActiveBg: 'bg-teal-100', activeText: 'text-teal-900',
  },
  green: {
    tileActiveBg: 'bg-green-600',
    tileInactiveBorder: 'border-green-500', tileInactiveHoverBg: 'hover:bg-green-50',
    accent: 'text-green-600', dot: 'bg-green-500', tabActiveBg: 'bg-green-100', activeText: 'text-green-900',
  },
};
