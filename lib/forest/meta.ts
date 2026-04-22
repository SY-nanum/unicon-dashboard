/** Shared forest metadata — safe to import in both server and client components */

/** Unique regions in fixed display order */
export const REGION_ORDER = [
  'Republic of Korea',
  'Japan',
  'China',
  'ASEAN',
  'India',
  'USA',
  'Canada',
  'Latin America',
  'European Union & United Kingdom',
  'Russia and Neighboring Transition Countries',
  'Oceania',
  'Sub-Saharan Africa',
  'Middle East & North Africa',
  'ROW',
];

export const REGION_LABELS: Record<string, string> = {
  'Republic of Korea': '한국',
  'Japan': '일본',
  'China': '중국',
  'ASEAN': 'ASEAN',
  'India': '인도',
  'USA': '미국',
  'Canada': '캐나다',
  'Latin America': '중남미',
  'European Union & United Kingdom': 'EU+UK',
  'Russia and Neighboring Transition Countries': '러시아',
  'Oceania': '오세아니아',
  'Sub-Saharan Africa': '사하라이남',
  'Middle East & North Africa': 'MENA',
  'ROW': '기타',
};
