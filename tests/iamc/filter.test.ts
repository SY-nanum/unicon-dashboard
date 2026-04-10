import { describe, it, expect } from 'vitest';
import { filterByVariablePattern } from '@/lib/iamc/filter';
import type { IamcRow } from '@/lib/iamc/types';

function row(variable: string): IamcRow {
  return {
    model: 'M',
    scenario: 'H',
    region: 'KOR',
    variable,
    unit: 'Mt',
    year: 2020,
    value: 1,
  };
}

const rows: IamcRow[] = [
  row('Capacity|Steel|BF-BOF'),
  row('Capacity|Steel|EAF'),
  row('Capacity|Steel|DRI-H2'),
  row('Production|Steel|Total'),
  row('Emissions|CO2|Steel|Total'),
  row('Energy Intensity|Steel|Coal'),
];

describe('filterByVariablePattern', () => {
  it('matches wildcard at end (Capacity|Steel|*)', () => {
    const r = filterByVariablePattern(rows, 'Capacity|Steel|*');
    expect(r).toHaveLength(3);
    expect(r.every((x) => x.variable.startsWith('Capacity|Steel|'))).toBe(true);
  });

  it('matches exact variable name', () => {
    const r = filterByVariablePattern(rows, 'Production|Steel|Total');
    expect(r).toHaveLength(1);
    expect(r[0].variable).toBe('Production|Steel|Total');
  });

  it('returns empty when no match', () => {
    const r = filterByVariablePattern(rows, 'NoSuchVar|*');
    expect(r).toHaveLength(0);
  });

  it('treats | as literal separator, not regex alternation', () => {
    // If | were unescaped regex OR, 'Capacity|Steel|BF-BOF' would match any row containing
    // 'Capacity' or 'Steel' or 'BF-BOF'. We need strict segmented matching.
    const r = filterByVariablePattern(rows, 'Capacity|Steel|BF-BOF');
    expect(r).toHaveLength(1);
  });

  it('wildcard matches single segment only (not across separators)', () => {
    const r = filterByVariablePattern(rows, 'Capacity|*|BF-BOF');
    expect(r).toHaveLength(1);
    expect(r[0].variable).toBe('Capacity|Steel|BF-BOF');
  });

  it('multiple wildcards', () => {
    const r = filterByVariablePattern(rows, '*|Steel|*');
    // Matches Capacity|Steel|BF-BOF, EAF, DRI-H2, Production|Steel|Total, Energy Intensity|Steel|Coal
    // but NOT Emissions|CO2|Steel|Total (4 segments)
    expect(r).toHaveLength(5);
    expect(r.some((x) => x.variable === 'Emissions|CO2|Steel|Total')).toBe(false);
  });
});
