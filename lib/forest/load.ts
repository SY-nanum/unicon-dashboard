// Design Ref: §4.3 — server-only CSV loader for forest IAMC data
import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface ForestRow {
  region: string;
  scenario: 'Historical' | 'BAU' | 'NetZero' | string;
  variable: string;
  unit: string;
  year: number;
  value: number;
}

const YEAR_COLS = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024',
                   '2025', '2030', '2035', '2040', '2045', '2050'];

let _cache: ForestRow[] | null = null;

export async function loadForestData(): Promise<ForestRow[]> {
  if (_cache) return _cache;

  const csvPath = path.resolve(
    process.cwd(),
    'data/forest/02_IAMC_Reports/Final_Comparison_All_Scenarios.csv',
  );
  const text = await readFile(csvPath, 'utf-8');
  // Strip BOM
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r?\n/).filter(Boolean);

  const headers = lines[0].split(',');
  const regionIdx = headers.indexOf('Region');
  const scenarioIdx = headers.indexOf('Scenario');
  const variableIdx = headers.indexOf('Variable');
  const unitIdx = headers.indexOf('Unit');

  const yearIndices: { year: number; idx: number }[] = YEAR_COLS.map((y) => ({
    year: parseInt(y),
    idx: headers.indexOf(y),
  })).filter((x) => x.idx !== -1);

  const rows: ForestRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 4) continue;

    const region = cols[regionIdx]?.trim();
    const scenario = cols[scenarioIdx]?.trim();
    const variable = cols[variableIdx]?.trim();
    const unit = cols[unitIdx]?.trim();

    for (const { year, idx } of yearIndices) {
      const raw = cols[idx]?.trim();
      if (!raw) continue;
      const value = parseFloat(raw);
      if (!isNaN(value)) {
        rows.push({ region, scenario, variable, unit, year, value });
      }
    }
  }

  _cache = rows;
  return rows;
}

export { REGION_ORDER, REGION_LABELS } from './meta';
