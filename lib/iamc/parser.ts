// Design Ref: §3.3, §4.2 — pivots IAMC wide-format rows to long format
// Plan SC-03: generic parser enables adding new variables without chart component changes

import type { IamcRow, IamcSheet } from './types';

/**
 * Pivots an IAMC wide-format sheet (rows of arrays, first row = header) to long format.
 *
 * Header shape expected:
 *   [Model, Scenario, Region, Variable, Unit, year1, year2, ..., Remark?]
 *
 * Skips rows where Model/Scenario/Variable/Region is blank (trailing sentinel rows in Excel).
 * Skips cells where value is null/undefined/'' (not-yet-calibrated future scenarios).
 */
export function pivotWideToLong(
  wideRows: unknown[][],
  meta: { sourceFile: string; sheetName: string },
): IamcSheet {
  if (wideRows.length < 2) {
    return emptySheet(meta);
  }

  const header = wideRows[0];
  const yearColumns: { index: number; year: number }[] = [];

  // Identify year columns (numeric headers). Stop at 'Remark' or any trailing non-numeric.
  for (let i = 5; i < header.length; i++) {
    const h = header[i];
    if (typeof h === 'number' && Number.isInteger(h) && h >= 1900 && h <= 2200) {
      yearColumns.push({ index: i, year: h });
    }
  }

  const remarkCol = header.findIndex(
    (h) => typeof h === 'string' && h.toLowerCase() === 'remark',
  );

  const rows: IamcRow[] = [];

  for (let r = 1; r < wideRows.length; r++) {
    const row = wideRows[r];
    const model = asString(row[0]);
    const scenario = asString(row[1]);
    const region = asString(row[2]);
    const variable = asString(row[3]);
    const unit = asString(row[4]);

    // Filter: skip rows with any blank identifier
    if (!model || !scenario || !region || !variable) continue;

    const remark = remarkCol >= 0 ? asString(row[remarkCol]) || undefined : undefined;

    for (const { index, year } of yearColumns) {
      const raw = row[index];
      if (raw === null || raw === undefined || raw === '') continue;
      const value = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(value)) continue;

      rows.push({ model, scenario, region, variable, unit, year, value, remark });
    }
  }

  return {
    rows,
    years: uniqueSorted(rows.map((r) => r.year), (a, b) => a - b),
    scenarios: uniqueSorted(rows.map((r) => r.scenario)),
    variables: uniqueSorted(rows.map((r) => r.variable)),
    regions: uniqueSorted(rows.map((r) => r.region)),
    units: uniqueSorted(rows.map((r) => r.unit)),
    sourceFile: meta.sourceFile,
    sheetName: meta.sheetName,
    parsedAt: new Date(),
  };
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function uniqueSorted<T>(arr: T[], cmp?: (a: T, b: T) => number): T[] {
  return Array.from(new Set(arr)).sort(cmp);
}

function emptySheet(meta: { sourceFile: string; sheetName: string }): IamcSheet {
  return {
    rows: [],
    years: [],
    scenarios: [],
    variables: [],
    regions: [],
    units: [],
    sourceFile: meta.sourceFile,
    sheetName: meta.sheetName,
    parsedAt: new Date(),
  };
}
