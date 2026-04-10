import { describe, it, expect } from 'vitest';
import { pivotWideToLong } from '@/lib/iamc/parser';

const META = { sourceFile: 'test.xlsx', sheetName: 'Sheet1' };

describe('pivotWideToLong', () => {
  it('pivots a simple 2x3 wide sheet into long rows', () => {
    const wide = [
      ['Model', 'Scenario', 'Region', 'Variable', 'Unit', 2020, 2021, 2022],
      ['M1', 'Historical', 'KOR', 'Capacity|Steel|BF-BOF', 'Mt', 48, 47.5, 47],
      ['M1', 'Historical', 'KOR', 'Capacity|Steel|EAF', 'Mt', 23.5, 23.5, 24],
    ];
    const sheet = pivotWideToLong(wide, META);
    expect(sheet.rows).toHaveLength(6);
    expect(sheet.years).toEqual([2020, 2021, 2022]);
    expect(sheet.scenarios).toEqual(['Historical']);
    expect(sheet.variables).toContain('Capacity|Steel|BF-BOF');
    expect(sheet.rows[0]).toMatchObject({
      scenario: 'Historical',
      variable: 'Capacity|Steel|BF-BOF',
      year: 2020,
      value: 48,
      unit: 'Mt',
    });
  });

  it('skips rows with blank scenario/variable/model/region', () => {
    const wide = [
      ['Model', 'Scenario', 'Region', 'Variable', 'Unit', 2020],
      ['M1', 'Historical', 'KOR', 'A', 'Mt', 1],
      [null, 'X', 'KOR', 'B', 'Mt', 2], // blank model
      ['M1', '', 'KOR', 'B', 'Mt', 3], // blank scenario
      ['M1', 'X', 'KOR', '', 'Mt', 4], // blank variable
      ['M1', 'X', '', 'Y', 'Mt', 5], // blank region
    ];
    const sheet = pivotWideToLong(wide, META);
    expect(sheet.rows).toHaveLength(1);
    expect(sheet.rows[0].value).toBe(1);
  });

  it('skips null/undefined value cells (not-yet-calibrated)', () => {
    const wide = [
      ['Model', 'Scenario', 'Region', 'Variable', 'Unit', 2020, 2025, 2030],
      ['M1', 'NetZero', 'KOR', 'A', 'Mt', null, 10, undefined],
    ];
    const sheet = pivotWideToLong(wide, META);
    expect(sheet.rows).toHaveLength(1);
    expect(sheet.rows[0].year).toBe(2025);
    expect(sheet.rows[0].value).toBe(10);
  });

  it('ignores non-numeric year headers like Remark', () => {
    const wide = [
      ['Model', 'Scenario', 'Region', 'Variable', 'Unit', 2020, 'Remark'],
      ['M1', 'H', 'KOR', 'A', 'Mt', 1, 'note-text'],
    ];
    const sheet = pivotWideToLong(wide, META);
    expect(sheet.years).toEqual([2020]);
    expect(sheet.rows).toHaveLength(1);
    expect(sheet.rows[0].remark).toBe('note-text');
  });

  it('returns empty sheet for header-only input', () => {
    const wide = [['Model', 'Scenario', 'Region', 'Variable', 'Unit', 2020]];
    const sheet = pivotWideToLong(wide, META);
    expect(sheet.rows).toHaveLength(0);
    expect(sheet.years).toEqual([]);
  });

  it('handles numeric strings as values', () => {
    const wide = [
      ['Model', 'Scenario', 'Region', 'Variable', 'Unit', 2020],
      ['M1', 'H', 'KOR', 'A', 'Mt', '42.5'],
    ];
    const sheet = pivotWideToLong(wide, META);
    expect(sheet.rows[0].value).toBe(42.5);
  });
});
