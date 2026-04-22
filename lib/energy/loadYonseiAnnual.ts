/**
 * Loader for '연세_annual' sheet in KEI_Power_Yonsei_V2.xlsx
 *
 * Sheet format (row 1-3 empty):
 *   Row 4: (region, 'ITEM', 'TECH', '2020', '2023', '2026', ... '2050')
 *   Row 5+: (KOR, genmix|capmix, TechName, values...)
 *
 * ITEM 'genmix' → generation mix (TWh/yr)
 * ITEM 'capmix' → capacity mix (GW)
 */

import 'server-only';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import * as XLSX from 'xlsx';

export interface YonseiAnnualRow {
  region: string;
  item: 'genmix' | 'capmix' | string;
  tech: string;
  year: number;
  value: number;
}

export interface YonseiAnnualSheet {
  rows: YonseiAnnualRow[];
  years: number[];
  techs: string[];
}

const SHEET_NAME = '연세_annual';
const cache = new Map<string, { sheet: YonseiAnnualSheet; mtimeMs: number }>();

export async function loadYonseiAnnualSheet(relativePath: string): Promise<YonseiAnnualSheet> {
  const cacheKey = `${relativePath}::${SHEET_NAME}`;

  // Try pre-built JSON cache (Vercel)
  const cacheFileName = cacheKey.replace(/[/\\:.]/g, '_') + '.json';
  const jsonCachePath = path.resolve(process.cwd(), 'data-cache', cacheFileName);
  try {
    const jsonData = await readFile(jsonCachePath, 'utf-8');
    const memCached = cache.get(cacheKey);
    if (memCached) return memCached.sheet;
    const wideRows = JSON.parse(jsonData) as unknown[][];
    const sheet = parseAnnualRows(wideRows);
    cache.set(cacheKey, { sheet, mtimeMs: 0 });
    return sheet;
  } catch { /* fall through */ }

  // Direct xlsx read (local dev)
  const absPath = path.resolve(process.cwd(), relativePath);
  let mtimeMs = 0;
  try { mtimeMs = (await stat(absPath)).mtimeMs; } catch { /* ignore */ }

  const memCached = cache.get(cacheKey);
  if (memCached && memCached.mtimeMs === mtimeMs && mtimeMs > 0) {
    return memCached.sheet;
  }

  const buffer = await readFile(absPath);
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  if (!wb.SheetNames.includes(SHEET_NAME)) {
    throw new Error(`Sheet "${SHEET_NAME}" not found in ${relativePath}. Available: ${wb.SheetNames.join(', ')}`);
  }
  const wideRows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[SHEET_NAME], {
    header: 1, raw: true, defval: null,
  });

  const sheet = parseAnnualRows(wideRows);
  cache.set(cacheKey, { sheet, mtimeMs });
  return sheet;
}

function parseAnnualRows(wideRows: unknown[][]): YonseiAnnualSheet {
  // Find header row: contains 'ITEM' in col 1
  let headerIdx = -1;
  for (let i = 0; i < wideRows.length; i++) {
    const cell = wideRows[i]?.[1];
    if (typeof cell === 'string' && cell.trim().toUpperCase() === 'ITEM') {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return { rows: [], years: [], techs: [] };

  const header = wideRows[headerIdx] as unknown[];
  // Year columns start at index 3
  const yearColumns: { index: number; year: number }[] = [];
  for (let i = 3; i < header.length; i++) {
    const h = header[i];
    const y = typeof h === 'number' ? h : Number(h);
    if (Number.isFinite(y) && y >= 2000 && y <= 2100) {
      yearColumns.push({ index: i, year: Math.round(y) });
    }
  }

  const rows: YonseiAnnualRow[] = [];
  for (let r = headerIdx + 1; r < wideRows.length; r++) {
    const row = wideRows[r];
    if (!row || !row[0]) continue;
    const region = str(row[0]);
    const item = str(row[1]);
    const tech = str(row[2]);
    if (!region || !item || !tech) continue;

    for (const { index, year } of yearColumns) {
      const raw = row[index];
      if (raw === null || raw === undefined) continue;
      const value = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(value) || Math.abs(value) < 1e-6) continue; // skip ~0 (model noise)
      rows.push({ region, item, tech, year, value });
    }
  }

  const years = unique(rows.map((r) => r.year)).sort((a, b) => a - b);
  const techs = unique(rows.filter((r) => r.item === 'genmix').map((r) => r.tech));
  return { rows, years, techs };
}

function str(v: unknown): string { return v == null ? '' : String(v).trim(); }
function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
