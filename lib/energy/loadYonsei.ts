/**
 * Custom loader for the '연세' sheet in KEI_Power_Yonsei.xlsx.
 *
 * Sheet format (non-IAMC):
 *   Row 0-3 : empty
 *   Row 4   : headers — [Model, region, timeslice, item, 2020, 2023, ..., 2050]
 *   Row 5+  : data rows
 *
 * 96 timeslices = 4 seasons × 24 hours
 *   Season 1 → TS1-TS24  (hour 0-23)
 *   Season 2 → TS25-TS48
 *   Season 3 → TS49-TS72
 *   Season 4 → TS73-TS96
 *
 * Items: 'netload' (GW), 'Solar' (GW)
 * Demand (GW) = netload + Solar
 */

import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import * as XLSX from 'xlsx';

export interface YonseiRow {
  model: string;
  region: string;
  timeslice: string; // 'TS1' … 'TS96'
  tsIndex: number;   // 1-96
  season: number;    // 1-4  (4 seasons, each 24 h)
  hour: number;      // 0-23
  item: string;      // 'netload' | 'Solar'
  year: number;
  value: number;     // GW
}

export interface YonseiSheet {
  rows: YonseiRow[];
  years: number[];
  items: string[];
  seasons: number[]; // [1,2,3,4]
}

const SHEET_NAME = '연세_hourly';

const cache = new Map<string, { sheet: YonseiSheet; mtimeMs: number }>();

/** Load the '연세' sheet. Falls back to data-cache JSON on Vercel. */
export async function loadYonseiSheet(relativePath: string): Promise<YonseiSheet> {
  const cacheKey = `${relativePath}::${SHEET_NAME}`;

  // ─── Try pre-built JSON cache (Vercel production) ────────────────────────
  const cacheFileName =
    cacheKey.replace(/[/\\:.]/g, '_') + '.json';
  const jsonCachePath = path.resolve(process.cwd(), 'data-cache', cacheFileName);
  try {
    const jsonData = await readFile(jsonCachePath, 'utf-8');
    const memCached = cache.get(cacheKey);
    if (memCached) return memCached.sheet;
    const wideRows = JSON.parse(jsonData) as unknown[][];
    const sheet = parseYonseiRows(wideRows);
    cache.set(cacheKey, { sheet, mtimeMs: 0 });
    return sheet;
  } catch {
    // JSON cache not found — fall through to xlsx
  }

  // ─── Direct xlsx read (local dev) ────────────────────────────────────────
  const absPath = path.resolve(process.cwd(), relativePath);
  let mtimeMs = 0;
  try {
    const s = await import('node:fs/promises').then((m) => m.stat(absPath));
    mtimeMs = s.mtimeMs;
  } catch { /* ignore */ }

  const memCached = cache.get(cacheKey);
  if (memCached && memCached.mtimeMs === mtimeMs && mtimeMs > 0) {
    return memCached.sheet;
  }

  const buffer = await readFile(absPath);
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });

  if (!wb.SheetNames.includes(SHEET_NAME)) {
    throw new Error(
      `Sheet "${SHEET_NAME}" not found in ${relativePath}. Available: ${wb.SheetNames.join(', ')}`,
    );
  }

  const ws = wb.Sheets[SHEET_NAME];
  const wideRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
  });

  const sheet = parseYonseiRows(wideRows);
  cache.set(cacheKey, { sheet, mtimeMs });
  return sheet;
}

// ─── Internal parser ─────────────────────────────────────────────────────────

function parseYonseiRows(wideRows: unknown[][]): YonseiSheet {
  // 1. Find header row (first cell === 'Model')
  let headerIdx = -1;
  for (let i = 0; i < wideRows.length; i++) {
    const cell = wideRows[i][0];
    if (typeof cell === 'string' && cell.trim().toLowerCase() === 'model') {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) {
    return { rows: [], years: [], items: [], seasons: [] };
  }

  const header = wideRows[headerIdx] as unknown[];

  // 2. Identify year columns (numeric 2000-2100 in positions ≥ 4)
  const yearColumns: { index: number; year: number }[] = [];
  for (let i = 4; i < header.length; i++) {
    const h = header[i];
    const y = typeof h === 'number' ? h : Number(h);
    if (Number.isFinite(y) && y >= 2000 && y <= 2100) {
      yearColumns.push({ index: i, year: Math.round(y) });
    }
  }

  // 3. Parse data rows
  const rows: YonseiRow[] = [];
  for (let r = headerIdx + 1; r < wideRows.length; r++) {
    const row = wideRows[r];
    const model = str(row[0]);
    const region = str(row[1]);
    const timeslice = str(row[2]);
    const item = str(row[3]);
    if (!model || !timeslice || !item) continue;

    const tsMatch = timeslice.match(/TS(\d+)/i);
    if (!tsMatch) continue;
    const tsIndex = parseInt(tsMatch[1], 10);
    const season = Math.ceil(tsIndex / 24);   // 1-4
    const hour   = (tsIndex - 1) % 24;        // 0-23

    for (const { index, year } of yearColumns) {
      const raw = row[index];
      if (raw === null || raw === undefined || raw === '') continue;
      const value = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(value)) continue;
      rows.push({ model, region, timeslice, tsIndex, season, hour, item, year, value });
    }
  }

  const years   = unique(rows.map((r) => r.year)).sort((a, b) => a - b);
  const items   = unique(rows.map((r) => r.item));
  const seasons = unique(rows.map((r) => r.season)).sort((a, b) => a - b);

  return { rows, years, items, seasons };
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
