// i18n translation dictionary for UNICON Dashboard.
// Supported: ko (Korean), en (English), zh (Chinese), ja (Japanese)
// Currently implemented: ko, en

export type Lang = 'ko' | 'en' | 'zh' | 'ja';
export const DEFAULT_LANG: Lang = 'ko';
export const SUPPORTED_LANGS: Lang[] = ['ko', 'en', 'zh', 'ja'];

export interface LangOption {
  code: Lang;
  flag: string;
  label: string;
}

export const LANG_OPTIONS: LangOption[] = [
  { code: 'ko', flag: '🇰🇷', label: '한국어' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
];

// ── Translation dictionary ──────────────────────────────────

const dict: Record<string, Record<Lang, string>> = {
  // Header
  'header.title': { ko: '통합평가모형 대시보드', en: 'Integrated Assessment Dashboard', zh: '综合评估模型仪表板', ja: '統合評価モデルダッシュボード' },

  // Home
  'home.title': { ko: '부문별 대시보드', en: 'Sector Dashboard', zh: '部门仪表板', ja: 'セクター別ダッシュボード' },
  'home.subtitle': { ko: '왼쪽 사이드바에서 부문을 선택하면 해당 부문의 차트 목록이 상단에 표시됩니다.', en: 'Select a sector from the left sidebar to see its chart list at the top.', zh: '从左侧选择部门查看图表列表。', ja: '左のサイドバーからセクターを選択してください。' },

  // Sector names
  'sector.integrated': { ko: '통합', en: 'Integrated', zh: '综合', ja: '統合' },
  'sector.energy': { ko: '에너지', en: 'Energy', zh: '能源', ja: 'エネルギー' },
  'sector.transport': { ko: '수송', en: 'Transport', zh: '交通', ja: '輸送' },
  'sector.industry': { ko: '산업', en: 'Industry', zh: '工业', ja: '産業' },
  'sector.building': { ko: '건물', en: 'Building', zh: '建筑', ja: '建物' },
  'sector.forestry': { ko: '산림', en: 'Forestry', zh: '林业', ja: '林業' },

  // Chart titles — Integrated
  'chart.cost-of-inaction': { ko: '기후 피해 비용\n비교', en: 'Climate Damage\nCost Comparison', zh: '气候损害\n成本比较', ja: '気候被害\nコスト比較' },
  'chart.ghg-pathway': { ko: '글로벌 GHG\n감축 경로', en: 'Global GHG\nReduction Pathway', zh: '全球GHG\n减排路径', ja: 'グローバルGHG\n削減経路' },
  'chart.carbon-trade': { ko: '탄소 가격 및\n무역 변화', en: 'Carbon Price &\nTrade Changes', zh: '碳价格与\n贸易变化', ja: '炭素価格と\n貿易変化' },
  'chart.temperature': { ko: '기온 상승\n경로', en: 'Temperature\nRise Pathway', zh: '温升\n路径', ja: '気温上昇\n経路' },
  'chart.damage-heatmap': { ko: '부문별\n피해 상세', en: 'Sector\nDamage Detail', zh: '部门\n损害详情', ja: 'セクター別\n被害詳細' },

  // Chart titles — Energy
  'chart.power-mix': { ko: '연도별\n전원 믹스', en: 'Annual\nPower Mix', zh: '年度\n电源结构', ja: '年度別\n電源ミックス' },
  'chart.duck-curve': { ko: '시간대별 전력수급 현황\n(Duck Curve 포함)', en: 'Hourly Power Supply/Demand\n(incl. Duck Curve)', zh: '时段电力供需\n(含鸭子曲线)', ja: '時間帯別電力需給\n(ダックカーブ含む)' },
  'chart.lcoe': { ko: 'LCOE 및\n그리드 패리티', en: 'LCOE &\nGrid Parity', zh: 'LCOE与\n电网平价', ja: 'LCOEと\nグリッドパリティ' },
  'chart.trade-flow': { ko: '동북아\n전력 융통량', en: 'Northeast Asia\nPower Trade Flow', zh: '东北亚\n电力贸易量', ja: '北東アジア\n電力融通量' },
  'chart.regional-lcoe': { ko: '지역별\n발전단가', en: 'Regional\nGeneration Cost', zh: '地区\n发电成本', ja: '地域別\n発電コスト' },

  // Chart titles — Transport
  'chart.stock-energy': { ko: '파워트레인별 차량 보급\n대수 및 총 에너지 수요', en: 'Vehicle Stock by Powertrain\n& Total Energy Demand', zh: '动力类型车辆保有量\n及总能源需求', ja: 'パワートレイン別車両\n台数と総エネルギー需要' },
  'chart.stock-share': { ko: '파워트레인별 차량\n등록대수 구성비', en: 'Vehicle Registration\nShare by Powertrain', zh: '动力类型车辆\n注册构成比', ja: 'パワートレイン別\n車両登録構成比' },
  'chart.energy-mix': { ko: '차종별\n에너지원 믹스', en: 'Energy Source Mix\nby Vehicle Type', zh: '车型\n能源结构', ja: '車種別\nエネルギー源ミックス' },
  'chart.ghg-trend': { ko: '온실가스\n배출 추이', en: 'GHG Emission\nTrend', zh: '温室气体\n排放趋势', ja: '温室効果ガス\n排出推移' },

  // Chart titles — Industry
  'chart.reduction-contribution': { ko: '철강 탄소 감축\n기여도', en: 'Steel Carbon\nReduction Contribution', zh: '钢铁碳减排\n贡献度', ja: '鉄鋼炭素削減\n寄与度' },
  'chart.process-mix': { ko: '공정 기술\n점유율 변화', en: 'Process Technology\nShare Changes', zh: '工艺技术\n占比变化', ja: '工程技術\nシェア変化' },
  'chart.energy-intensity': { ko: '에너지 집약도 및\n소비 구조', en: 'Energy Intensity &\nConsumption Structure', zh: '能源强度与\n消费结构', ja: 'エネルギー集約度と\n消費構造' },
  'chart.capex': { ko: '전환 투자비용\n구조', en: 'Transition Investment\nCost Structure', zh: '转型投资\n成本结构', ja: '転換投資\nコスト構造' },
  'chart.cbam': { ko: 'CBAM 경쟁력\n진단', en: 'CBAM Competitiveness\nDiagnosis', zh: 'CBAM竞争力\n诊断', ja: 'CBAM競争力\n診断' },

  // Chart titles — Building
  'chart.energy-by-source': { ko: '에너지원별\n소비량', en: 'Consumption\nby Energy Source', zh: '能源\n消费量', ja: 'エネルギー源別\n消費量' },
  'chart.eui': { ko: '서비스별 EUI\n(Energy Use Intensity)', en: 'EUI by Service\n(Energy Use Intensity)', zh: '服务EUI\n(能源使用强度)', ja: 'サービス別EUI\n(エネルギー使用強度)' },
  'chart.reduction': { ko: '감축\n기여도', en: 'Reduction\nContribution', zh: '减排\n贡献度', ja: '削減\n寄与度' },
  'chart.hdd-cdd': { ko: 'HDD\n/CDD', en: 'HDD\n/CDD', zh: 'HDD\n/CDD', ja: 'HDD\n/CDD' },
  'chart.floor-area': { ko: '건물 연면적\n전망', en: 'Building Floor Area\nOutlook', zh: '建筑面积\n展望', ja: '建物延床面積\n見通し' },

  // Chart titles — Forestry
  'chart.biomass-map': { ko: '산림바이오\n매스지도', en: 'Forest Biomass\nMap', zh: '森林生物量\n地图', ja: '森林バイオマス\nマップ' },
  'chart.carbon-stock': { ko: '국가별탄소\n저장량추이', en: 'Carbon Stock\nTrend by Country', zh: '碳储量\n趋势', ja: '炭素貯蔵量\n推移' },
  'chart.age-class': { ko: '영급구조\n변화', en: 'Age Class\nStructure Change', zh: '龄级结构\n变化', ja: '齢級構造\n変化' },
  'chart.age-map': { ko: '임령\n지도', en: 'Forest Age\nMap', zh: '林龄\n地图', ja: '林齢\nマップ' },
  'chart.site-index-map': { ko: '산림\n탄소밀도', en: 'Forest Carbon\nDensity', zh: '森林碳\n密度', ja: '森林炭素\n密度' },
  'chart.annual-flux': { ko: '연간\n순흡수량', en: 'Annual Net\nAbsorption', zh: '年净\n吸收量', ja: '年間\n純吸収量' },

  // UI labels
  'ui.region': { ko: '지역 선택', en: 'Region', zh: '选择地区', ja: '地域選択' },
  'ui.scenario': { ko: '시나리오 선택', en: 'Scenario', zh: '情景选择', ja: 'シナリオ選択' },
  'ui.scenario.max': { ko: '최대 {n}개 선택', en: 'Max {n} selections', zh: '最多选择{n}个', ja: '最大{n}個選択' },
  'ui.placeholder': { ko: '데이터 확보중', en: 'Data pending', zh: '数据准备中', ja: 'データ準備中' },
  'ui.preparing': { ko: '준비중', en: 'Soon', zh: '准备中', ja: '準備中' },
  'ui.source': { ko: 'Source', en: 'Source', zh: 'Source', ja: 'Source' },

  // Page titles — Industry (full, for page headings)
  'page.industry.reduction': { ko: '철강 탄소 감축 기여도', en: 'Steel Carbon Reduction Contribution', zh: '钢铁碳减排贡献度', ja: '鉄鋼炭素削減寄与度' },
  'page.industry.process-mix': { ko: '철강 공정기술 점유율 변화', en: 'Steel Process Technology Share Changes', zh: '钢铁工艺技术占比变化', ja: '鉄鋼工程技術シェア変化' },
  'page.industry.energy-intensity': { ko: '에너지 집약도 및 소비 구조', en: 'Energy Intensity & Consumption Structure', zh: '能源强度与消费结构', ja: 'エネルギー集約度と消費構造' },
  'page.industry.capex': { ko: '전환 투자비용 구조', en: 'Transition Investment Cost Structure', zh: '转型投资成本结构', ja: '転換投資コスト構造' },
  'page.industry.cbam': { ko: 'CBAM 경쟁력 진단', en: 'CBAM Competitiveness Diagnosis', zh: 'CBAM竞争力诊断', ja: 'CBAM競争力診断' },

  // Page subtitles — Industry
  'page.industry.reduction.sub': { ko: '산업 부문 · {region} · BAU 대비 NetZero 감축 경로 분해 (Mt CO₂)', en: 'Industry · {region} · BAU vs NetZero reduction pathway decomposition (Mt CO₂)', zh: '工业部门 · {region} · BAU对比NetZero减排路径分解 (Mt CO₂)', ja: '産業部門 · {region} · BAU対NetZero削減経路分解 (Mt CO₂)' },
  'page.industry.process-mix.sub': { ko: '산업 부문 · {region} · 고로(BF) / 전기로(EAF) / 수소환원제철(DRI-H2) 공정 용량 (Mt)', en: 'Industry · {region} · BF / EAF / DRI-H2 process capacity (Mt)', zh: '工业部门 · {region} · 高炉/电炉/氢还原 工艺产能 (Mt)', ja: '産業部門 · {region} · BF / EAF / DRI-H2 工程能力 (Mt)' },
  'page.industry.energy-intensity.sub': { ko: '산업 부문 · {region} · 연료별 에너지 원단위 (toe/ton)', en: 'Industry · {region} · Energy unit consumption by fuel (toe/ton)', zh: '工业部门 · {region} · 分燃料能源单耗 (toe/ton)', ja: '産業部門 · {region} · 燃料別エネルギー原単位 (toe/ton)' },
  'page.industry.capex.sub': { ko: '산업 부문 · {region} · NetZero CAPEX/OPEX (Million USD)', en: 'Industry · {region} · NetZero CAPEX/OPEX (Million USD)', zh: '工业部门 · {region} · NetZero CAPEX/OPEX (百万美元)', ja: '産業部門 · {region} · NetZero CAPEX/OPEX (百万USD)' },
  'page.industry.cbam.sub': { ko: '산업 부문 · {region} · 철강 탄소 집약도 경로 (tCO₂/ton)', en: 'Industry · {region} · Steel carbon intensity pathway (tCO₂/ton)', zh: '工业部门 · {region} · 钢铁碳强度路径 (tCO₂/ton)', ja: '産業部門 · {region} · 鉄鋼炭素集約度経路 (tCO₂/ton)' },

  // Page titles — Forestry
  'page.forestry.carbon-stock': { ko: '국가별 탄소 저장량 추이', en: 'Carbon Stock Trend by Country', zh: '各国碳储量趋势', ja: '国別炭素貯蔵量推移' },
  'page.forestry.carbon-stock.sub': { ko: '산림 부문 · {region} · 시나리오별 산림 탄소 저장량 (Mt C)', en: 'Forestry · {region} · Forest carbon stock by scenario (Mt C)', zh: '林业 · {region} · 情景别森林碳储量 (Mt C)', ja: '林業 · {region} · シナリオ別森林炭素貯蔵量 (Mt C)' },
  'page.forestry.annual-flux': { ko: '연간 순흡수량', en: 'Annual Net Absorption', zh: '年净吸收量', ja: '年間純吸収量' },
  'page.forestry.annual-flux.sub': { ko: '산림 부문 · {region} · LULUCF CO₂ 순 흡수/배출량 (Mt CO₂/yr, 음수 = 흡수)', en: 'Forestry · {region} · LULUCF CO₂ net flux (Mt CO₂/yr, negative = absorption)', zh: '林业 · {region} · LULUCF CO₂净通量 (Mt CO₂/yr, 负值=吸收)', ja: '林業 · {region} · LULUCF CO₂ 純フラックス (Mt CO₂/yr, 負=吸収)' },

  // Scenario meta
  'scenario.bau': { ko: '현상유지 전망', en: 'Business as Usual', zh: '基准情景', ja: '現状維持見通し' },
  'scenario.bau.hint': { ko: '정책 개입 없이 현재 추세 지속', en: 'Current trends without policy intervention', zh: '无政策干预下当前趋势延续', ja: '政策介入なしの現在のトレンド継続' },
  'scenario.netzero': { ko: '탄소중립 시나리오', en: 'Net Zero Scenario', zh: '碳中和情景', ja: 'カーボンニュートラルシナリオ' },
  'scenario.netzero.hint': { ko: '2050 탄소중립 달성 경로', en: '2050 carbon neutrality pathway', zh: '2050碳中和实现路径', ja: '2050年カーボンニュートラル達成経路' },

  // ProcessMixChart footer
  'footer.historical': { ko: 'Historical (실측)', en: 'Historical (actual)', zh: 'Historical (实测)', ja: 'Historical (実測)' },
  'footer.projection': { ko: 'Projection (모델 예측)', en: 'Projection (model forecast)', zh: 'Projection (模型预测)', ja: 'Projection (モデル予測)' },
  'footer.data-pending': { ko: '데이터 확보중', en: 'Data pending', zh: '数据准备中', ja: 'データ準備中' },

  // Chart axis & legend labels
  'axis.year': { ko: '연도', en: 'Year', zh: '年份', ja: '年度' },
  'axis.capacity': { ko: '용량', en: 'Capacity', zh: '产能', ja: '能力' },
  'axis.share-pct': { ko: '점유율 (%)', en: 'Share (%)', zh: '占比 (%)', ja: 'シェア (%)' },
  'label.actual': { ko: '실측', en: 'Actual', zh: '实测', ja: '実測' },
  'label.forecast': { ko: '예측', en: 'Forecast', zh: '预测', ja: '予測' },
  'label.total': { ko: '합계', en: 'Total', zh: '合计', ja: '合計' },
  'label.trend': { ko: '추세', en: 'Trend', zh: '趋势', ja: 'トレンド' },
  'label.mean': { ko: '평균', en: 'Mean', zh: '平均', ja: '平均' },
  'label.range': { ko: '범위', en: 'Range', zh: '范围', ja: '範囲' },
  'label.no-map-data': { ko: '지도 데이터가 없습니다.', en: 'No map data available.', zh: '没有地图数据。', ja: '地図データがありません。' },

  // Waterfall chart
  'waterfall.bau-emission': { ko: 'BAU 배출량', en: 'BAU Emissions', zh: 'BAU排放量', ja: 'BAU排出量' },
  'waterfall.nz-emission': { ko: 'NetZero 배출량', en: 'NetZero Emissions', zh: 'NetZero排放量', ja: 'NetZero排出量' },
  'waterfall.total-reduction': { ko: '총 감축량', en: 'Total Reduction', zh: '总减排量', ja: '総削減量' },
  'waterfall.yaxis': { ko: '감축량 / 배출량 (Mt CO₂)', en: 'Reduction / Emissions (Mt CO₂)', zh: '减排量/排放量 (Mt CO₂)', ja: '削減量/排出量 (Mt CO₂)' },
  'waterfall.efficiency': { ko: '효율 개선', en: 'Efficiency', zh: '效率提升', ja: '効率改善' },
  'waterfall.fuel-switch': { ko: '연료 전환', en: 'Fuel Switch', zh: '燃料转换', ja: '燃料転換' },
  'waterfall.ccus': { ko: 'CCUS', en: 'CCUS', zh: 'CCUS', ja: 'CCUS' },
  'waterfall.hydrogen': { ko: '수소 환원', en: 'Hydrogen', zh: '氢还原', ja: '水素還元' },

  // ScenarioPicker
  'picker.scenario': { ko: '시나리오:', en: 'Scenario:', zh: '情景:', ja: 'シナリオ:' },
  'picker.max': { ko: '최대 {n}개 선택', en: 'Max {n}', zh: '最多{n}个', ja: '最大{n}個' },

  // Forestry page titles
  'page.forestry.biomass-map': { ko: '산림 바이오매스 지도', en: 'Forest Biomass Map', zh: '森林生物量地图', ja: '森林バイオマスマップ' },
  'page.forestry.biomass-map.sub': { ko: '산림 부문 · {region} · 1km 격자 바이오매스 밀도 (t/ha)', en: 'Forestry · {region} · 1km grid biomass density (t/ha)', zh: '林业 · {region} · 1km格网生物量密度 (t/ha)', ja: '林業 · {region} · 1kmメッシュバイオマス密度 (t/ha)' },
  'page.forestry.age-map': { ko: '임령 지도', en: 'Forest Age Map', zh: '林龄地图', ja: '林齢マップ' },
  'page.forestry.age-map.sub': { ko: '산림 부문 · {region} · 1km 격자 산림 임령 (yr)', en: 'Forestry · {region} · 1km grid forest age (yr)', zh: '林业 · {region} · 1km格网林龄 (yr)', ja: '林業 · {region} · 1kmメッシュ林齢 (yr)' },
  'page.forestry.site-index': { ko: '산림 탄소밀도', en: 'Forest Carbon Density', zh: '森林碳密度', ja: '森林炭素密度' },
  'page.forestry.site-index.sub': { ko: '산림 부문 · {region} · Site Index (임목 생장 잠재력, m)', en: 'Forestry · {region} · Site Index (growth potential, m)', zh: '林业 · {region} · 立地指数 (生长潜力, m)', ja: '林業 · {region} · 地位指数 (成長ポテンシャル, m)' },
  'page.forestry.site-index.desc': { ko: '지위지수(Site Index)는 산림의 생장 잠재력을 나타내는 지표로, 우세목의 예상 수고(단위: m)로 측정됩니다. 토양, 지형, 기후 등 입지 조건에 의해 결정되며, 값이 높을수록 생산성이 우수한 산림입니다.', en: 'Site Index indicates the growth potential of a forest, measured by the expected height (m) of dominant trees. It is determined by site conditions such as soil, terrain, and climate — higher values indicate more productive forests.', zh: '立地指数表示森林的生长潜力，以优势木的预期树高(m)衡量。由土壤、地形、气候等条件决定，值越高表示森林生产力越强。', ja: '地位指数は森林の成長ポテンシャルを示す指標で、優勢木の予想樹高(m)で測定されます。土壌、地形、気候等の立地条件により決定され、値が高いほど生産性の高い森林です。' },
  'page.forestry.site-index.note': { ko: '※ 2050 예측값과 현재값이 완전히 동일합니다. 지위지수는 토양·지형에 의해 결정되는 정적(Static) 속성으로, BAU/NetZero 시나리오에 따라 변화하지 않습니다.', en: '※ 2050 forecast equals current values. Site Index is a static property determined by soil/terrain and does not change with BAU/NetZero scenarios.', zh: '※ 2050预测值与现值完全相同。立地指数是由土壤/地形决定的静态属性，不随BAU/NetZero情景变化。', ja: '※ 2050年予測値と現在値は完全に同一です。地位指数は土壌・地形により決定される静的属性で、BAU/NetZeroシナリオでは変化しません。' },
  'page.forestry.age-class': { ko: '영급 구조 변화', en: 'Age Class Structure Change', zh: '龄级结构变化', ja: '齢級構造変化' },
  'page.forestry.age-class.sub': { ko: '산림 부문 · {region} · 영급별 산림 면적 (Million ha)', en: 'Forestry · {region} · Forest area by age class (Million ha)', zh: '林业 · {region} · 各龄级森林面积 (百万公顷)', ja: '林業 · {region} · 齢級別森林面積 (百万ha)' },

  // Map layer labels
  'map.actual': { ko: '(실측)', en: '(actual)', zh: '(实测)', ja: '(実測)' },
  'map.forecast': { ko: '(예측)', en: '(forecast)', zh: '(预测)', ja: '(予測)' },
  'map.site-index': { ko: '지위지수', en: 'Site Index', zh: '立地指数', ja: '地位指数' },

  // Forest age class labels
  'age.young': { ko: '유령림 (0-20년)', en: 'Young (0-20yr)', zh: '幼龄林 (0-20年)', ja: '幼齢林 (0-20年)' },
  'age.middle': { ko: '중령림 (21-40년)', en: 'Middle-aged (21-40yr)', zh: '中龄林 (21-40年)', ja: '中齢林 (21-40年)' },
  'age.mature': { ko: '장령림 (41-60년)', en: 'Mature (41-60yr)', zh: '近熟林 (41-60年)', ja: '壮齢林 (41-60年)' },
  'age.old': { ko: '노령림 (61년+)', en: 'Old-growth (61yr+)', zh: '过熟林 (61年+)', ja: '老齢林 (61年+)' },

  // Data labels — Industry process mix
  'tech.bf-bof': { ko: '고로 (BF)', en: 'BF-BOF', zh: '高炉 (BF)', ja: '高炉 (BF)' },
  'tech.eaf': { ko: '전기로 (EAF)', en: 'EAF', zh: '电炉 (EAF)', ja: '電炉 (EAF)' },
  'tech.dri-h2': { ko: '수소환원제철 (DRI-H2)', en: 'DRI-H2', zh: '氢还原 (DRI-H2)', ja: '水素還元 (DRI-H2)' },

  // Data labels — Energy intensity fuels
  'fuel.coal': { ko: '석탄 (Coal)', en: 'Coal', zh: '煤炭', ja: '石炭' },
  'fuel.electricity': { ko: '전기 (Electricity)', en: 'Electricity', zh: '电力', ja: '電力' },
  'fuel.hydrogen': { ko: '수소 (Hydrogen)', en: 'Hydrogen', zh: '氢', ja: '水素' },

  // Data labels — CAPEX/OPEX
  'cost.capex': { ko: 'CAPEX (설비투자)', en: 'CAPEX', zh: 'CAPEX (设备投资)', ja: 'CAPEX (設備投資)' },
  'cost.opex': { ko: 'OPEX (운영비)', en: 'OPEX', zh: 'OPEX (运营费)', ja: 'OPEX (運営費)' },

  // Forestry yAxis labels
  'yaxis.carbon-stock': { ko: '탄소 저장량 (Mt C)', en: 'Carbon Stock (Mt C)', zh: '碳储量 (Mt C)', ja: '炭素貯蔵量 (Mt C)' },
  'yaxis.net-flux': { ko: '순흡수량 (Mt CO₂/yr)', en: 'Net Flux (Mt CO₂/yr)', zh: '净通量 (Mt CO₂/yr)', ja: '純フラックス (Mt CO₂/yr)' },
};

// ── Accessor ────────────────────────────────────────────────

export function t(key: string, lang: Lang, vars?: Record<string, string>): string {
  const entry = dict[key];
  if (!entry) return key;
  let text = entry[lang] ?? entry.ko;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

/** Get sector name by slug for a given language */
export function sectorName(slug: string, lang: Lang): string {
  return t(`sector.${slug}`, lang);
}

/** Get chart title by slug for a given language */
export function chartTitle(slug: string, lang: Lang): string {
  return t(`chart.${slug}`, lang);
}
