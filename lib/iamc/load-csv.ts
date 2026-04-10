// CSV variant of the IAMC loader — handles forest/*.csv files from PTU.
// Some BAU files lack the Scenario column; it can be injected via `scenarioOverride`.

import 'server-only';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pivotWideToLong } from './parser';
import type { IamcSheet, IamcRow } from './types';

interface CacheEntry {
  sheet: IamcSheet;
  mtimeMs: number;
}
const cache = new Map<string, CacheEntry>();

/**
 * Load an IAMC CSV file and pivot to long format.
 * If the CSV lacks a Scenario column, pass `scenarioOverride` to inject one.
 * If the CSV has Region,Variable,Unit,... (no Model), a synthetic "Model" is inserted.
 */
export async function loadIamcCsv(
  relativePath: string,
  opts: { scenarioOverride?: string; model?: string } = {},
): Promise<IamcSheet> {
  const absPath = path.resolve(process.cwd(), relativePath);
  const cacheKey = `${absPath}::${opts.scenarioOverride ?? ''}::${opts.model ?? ''}`;
  const { mtimeMs } = await stat(absPath);
  const cached = cache.get(cacheKey);
  if (cached && cached.mtimeMs === mtimeMs) return cached.sheet;

  const text = await readFile(absPath, 'utf-8');
  const rows = parseCsv(text);
  if (rows.length < 2) {
    const empty: IamcSheet = {
      rows: [], years: [], scenarios: [], variables: [], regions: [], units: [],
      sourceFile: relativePath, sheetName: '(csv)', parsedAt: new Date(),
    };
    cache.set(cacheKey, { sheet: empty, mtimeMs });
    return empty;
  }

  // Normalize header to Model,Scenario,Region,Variable,Unit,year1,year2,...
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, '').trim());
  const model = opts.model ?? 'PTU_Forest';
  const scenario = opts.scenarioOverride;

  // Detect columns present
  const hasModel = header[0].toLowerCase() === 'model';
  const hasScenario = header.some((h) => h.toLowerCase() === 'scenario');
  const regionIdx = header.findIndex((h) => h.toLowerCase() === 'region');
  const scenarioIdx = header.findIndex((h) => h.toLowerCase() === 'scenario');
  const variableIdx = header.findIndex((h) => h.toLowerCase() === 'variable');
  const unitIdx = header.findIndex((h) => h.toLowerCase() === 'unit');

  // Build normalized wide format
  const normHeader: unknown[] = ['Model', 'Scenario', 'Region', 'Variable', 'Unit'];
  const yearStartIdx = Math.max(regionIdx, scenarioIdx, variableIdx, unitIdx) + 1;
  for (let i = yearStartIdx; i < header.length; i++) {
    const n = Number(header[i]);
    normHeader.push(Number.isInteger(n) && n >= 1900 && n <= 2200 ? n : header[i]);
  }

  const normRows: unknown[][] = [normHeader];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || row.every((c) => c === '' || c == null)) continue;

    const normRow: unknown[] = [
      hasModel ? row[0] : model,
      hasScenario ? row[scenarioIdx] : (scenario ?? ''),
      row[regionIdx],
      row[variableIdx],
      row[unitIdx],
      ...row.slice(yearStartIdx),
    ];
    normRows.push(normRow);
  }

  const sheet = pivotWideToLong(normRows, {
    sourceFile: relativePath,
    sheetName: '(csv)',
  });
  cache.set(cacheKey, { sheet, mtimeMs });
  return sheet;
}

/** Merge multiple IamcSheets (e.g. Historical + BAU + NetZero for one country). */
export function mergeSheets(sheets: IamcSheet[]): IamcRow[] {
  return sheets.flatMap((s) => s.rows);
}

/** Minimal CSV parser — handles quoted fields + commas in values. */
function parseCsv(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out: string[][] = [];
  for (const line of lines) {
    if (line.length === 0) continue;
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ',') { cells.push(cur); cur = ''; }
        else cur += ch;
      }
    }
    cells.push(cur);
    out.push(cells);
  }
  return out;
}

/**
 * Convenience: load historical + BAU + NetZero for a given country code.
 * Returns combined long-format rows tagged with scenario.
 * Returns empty array if files don't exist (데이터 확보중).
 */
export async function loadForestCountryScenarios(countryCode: string): Promise<IamcRow[]> {
  const base = 'data/forest';
  const paths = [
    { path: `${base}/IAMC_Reports_Historical/${countryCode}_Historical.csv`, opts: {} },
    { path: `${base}/IAMC_Reports_Outputs/${countryCode}_IAMC_BAU.csv`, opts: { scenarioOverride: 'BAU' } },
    { path: `${base}/IAMC_Reports_NetZero/${countryCode}_NetZero.csv`, opts: {} },
  ];
  const rows: IamcRow[] = [];
  for (const { path: p, opts } of paths) {
    try {
      const sheet = await loadIamcCsv(p, opts);
      rows.push(...sheet.rows);
    } catch {
      // File doesn't exist for this country — skip silently
    }
  }
  return rows;
}
