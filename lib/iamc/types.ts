// Design Ref: §3.2 — IAMC long format internal model
// Enables ECharts dataset API + future GROUP BY queries when bkend.ai migration happens (AD-3)

export interface IamcRow {
  model: string;       // "SNU_Ind"
  scenario: string;    // "Historical" | "BAU" | "NetZero" | ...
  region: string;      // "KOR"
  variable: string;    // "Capacity|Steel|BF-BOF"
  unit: string;        // "Mt"
  year: number;        // 2020
  value: number;       // 48.0
  remark?: string;
}

export interface IamcSheet {
  rows: IamcRow[];
  years: number[];         // sorted unique years seen
  scenarios: string[];     // distinct scenarios
  variables: string[];     // distinct variables
  regions: string[];
  units: string[];
  sourceFile: string;
  sheetName: string;
  parsedAt: Date;
}
