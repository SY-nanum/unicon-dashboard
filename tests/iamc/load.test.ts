import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { pivotWideToLong } from '@/lib/iamc/parser';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import path from 'node:path';

// Integration test against the real SNU submission file.
// Bypasses lib/iamc/load.ts (which requires 'server-only' + Next RSC context)
// by exercising the same xlsx → parser pipeline directly.

describe('Industry submission (real data)', () => {
  const submissionPath = path.resolve(
    __dirname,
    '../../data/industry/SNU_Ind_Submission.xlsx',
  );

  function loadSheet(sheetName: string) {
    const wb = XLSX.read(readFileSync(submissionPath), { type: 'buffer', cellDates: false });
    const ws = wb.Sheets[sheetName];
    const wide = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });
    return pivotWideToLong(wide, { sourceFile: submissionPath, sheetName });
  }

  it('loads Table_Ind_Tech_Mix with Historical + NetZero scenarios', () => {
    const sheet = loadSheet('Table_Ind_Tech_Mix');
    expect(sheet.scenarios).toContain('Historical');
    expect(sheet.scenarios).toContain('NetZero');
    expect(sheet.regions).toEqual(['KOR']);
  });

  it('has all 3 process technologies in capacity filter', () => {
    const sheet = loadSheet('Table_Ind_Tech_Mix');
    const capacity = filterByVariablePattern(sheet.rows, 'Capacity|Steel|*');
    const techs = new Set(capacity.map((r) => r.variable));
    expect(techs).toEqual(
      new Set([
        'Capacity|Steel|BF-BOF',
        'Capacity|Steel|EAF',
        'Capacity|Steel|DRI-H2',
      ]),
    );
  });

  it('Historical BF-BOF 2020 value equals known ground truth (48 Mt)', () => {
    const sheet = loadSheet('Table_Ind_Tech_Mix');
    const match = sheet.rows.find(
      (r) =>
        r.scenario === 'Historical' &&
        r.variable === 'Capacity|Steel|BF-BOF' &&
        r.year === 2020,
    );
    expect(match).toBeDefined();
    expect(match!.value).toBe(48);
  });

  it('NetZero scenario has data for 2025-2050', () => {
    const sheet = loadSheet('Table_Ind_Tech_Mix');
    const nzRows = sheet.rows.filter((r) => r.scenario === 'NetZero');
    const years = new Set(nzRows.map((r) => r.year));
    for (const y of [2025, 2030, 2035, 2040, 2045, 2050]) {
      expect(years.has(y), `year ${y} missing in NetZero`).toBe(true);
    }
  });
});
