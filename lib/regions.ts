// UNICON region classification for dashboard dropdown.

export interface RegionOption {
  code: string;
  name: string;
}

export const REGIONS: RegionOption[] = [
  { code: 'GLOBAL', name: 'Global' },
  { code: 'KOR', name: '한국' },
  { code: 'PRK', name: '북한' },
  { code: 'JPN', name: '일본' },
  { code: 'CHN', name: '중국' },
  { code: 'USA', name: '미국' },
  { code: 'CAN', name: '캐나다' },
  { code: 'GBR', name: '영국' },
  { code: 'RUS', name: '러시아' },
  { code: 'IND', name: '인도' },
  { code: 'IDN', name: '인도네시아' },
  { code: 'MEX', name: '멕시코' },
  { code: 'AUS', name: '호주' },
  { code: 'NZL', name: '뉴질랜드' },
  { code: 'EU27', name: 'EU27' },
  { code: 'NON_EU_EUR', name: 'Non-EU 유럽' },
  { code: 'ASEAN', name: '동남아' },
  { code: 'SOUTH_ASIA', name: '남아시아' },
  { code: 'MIDDLE_EAST', name: '중동' },
  { code: 'NORTH_AFRICA', name: '북아프리카' },
  { code: 'LATIN_AMERICA', name: '라틴아메리카' },
  { code: 'OCEANIA', name: '호주권' },
  { code: 'OTHER', name: '기타' },
];

export const DEFAULT_REGION = 'KOR';
