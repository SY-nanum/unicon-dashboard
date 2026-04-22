/**
 * Loader for '연세_TRADE' sheet in KEI_Power_Yonsei_V2.xlsx
 *
 * Sheet layout (rows 1-6 empty):
 *   Row 7: year headers  → (None, None, None, 2026, 2026, 2026, 2026, 2029, ...)
 *   Row 8: from-country  → (None, None, None, CHN,  JPN,  KOR,  KOR, ...)
 *   Row 9: to-country    → (None, None, None, KOR,  KOR,  CHN,  JPN, ...)
 *   Row 10+: TS1-TS96 data rows
 *
 * Values: electricity trade flow (GWh per timeslice representative period)
 * 96 timeslices = 4 seasons × 24 hours
 * Annual GWh ≈ sum(TS) × (8760 / 96)
 *
 * NOTE: reads xlsx directly (included in Vercel bundle via outputFileTracingIncludes).
 * In-memory module cache handles warm lambda restarts.
 */

import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import * as XLSX from 'xlsx';

export interface TradeRow {
  year: number;
  from: string;  // 'CHN' | 'JPN' | 'KOR'
  to: string;
  tsIndex: number;
  value: number;
}

export interface TradeSheet {
  rows: TradeRow[];
  years: number[];
  /** Annual aggregated TWh (sum × 8760/96 / 1000) per year+from+to */
  annual: AnnualTrade[];
}

export interface AnnualTrade {
  year: number;
  from: string;
  to: string;
  /** GWh/year  (= sum_ts × 8760/96) */
  gwh: number;
}

const SHEET_NAME = '연세_TRADE';
const TS_SCALE = 8760 / 96; // hours per timeslice
const cache = new Map<string, TradeSheet>();

export async function loadYonseiTradeSheet(relativePath: string): Promise<TradeSheet> {
  const cached = cache.get(relativePath);
  if (cached) return cached;

  const absPath = path.resolve(process.cwd(), relativePath);
  const buffer = await readFile(absPath);
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  if (!wb.SheetNames.includes(SHEET_NAME)) {
    throw new Error(`Sheet "${SHEET_NAME}" not found. Available: ${wb.SheetNames.join(', ')}`);
  }
  const wideRows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[SHEET_NAME], {
    header: 1, raw: true, defval: null,
  });

  const sheet = parseTradeRows(wideRows);
  cache.set(relativePath, sheet);
  return sheet;
}

function parseTradeRows(wideRows: unknown[][]): TradeSheet {
  // Find year-header row: row with numeric year values ≥ 2020
  let yearRowIdx = -1;
  for (let i = 0; i < wideRows.length; i++) {
    const row = wideRows[i];
    const yearCells = row?.slice(1).filter((c) => typeof c === 'number' && c >= 2020 && c <= 2100);
    if (yearCells && yearCells.length >= 3) {
      yearRowIdx = i;
      break;
    }
  }
  if (yearRowIdx < 0) return { rows: [], years: [], annual: [] };

  const yearRow  = wideRows[yearRowIdx]  as unknown[];
  const fromRow  = wideRows[yearRowIdx + 1] as unknown[];
  const toRow    = wideRows[yearRowIdx + 2] as unknown[];

  // Build column descriptors — data columns start at index 1
  interface ColDef { colIdx: number; year: number; from: string; to: string }
  const cols: ColDef[] = [];
  for (let c = 1; c < yearRow.length; c++) {
    const y = yearRow[c];
    const from = fromRow?.[c];
    const to   = toRow?.[c];
    if (typeof y === 'number' && y >= 2020 && typeof from === 'string' && typeof to === 'string') {
      cols.push({ colIdx: c, year: y, from: from.trim(), to: to.trim() });
    }
  }

  // Parse TS data rows (start after 3 header rows)
  // TS label is at column 0 (e.g. "TS1")
  const dataStart = yearRowIdx + 3;
  const rows: TradeRow[] = [];
  for (let r = dataStart; r < wideRows.length; r++) {
    const row = wideRows[r];
    if (!row) continue;
    const tsCell = row[0];
    if (typeof tsCell !== 'string') continue;
    const match = tsCell.match(/TS(\d+)/i);
    if (!match) continue;
    const tsIndex = parseInt(match[1], 10);

    for (const { colIdx, year, from, to } of cols) {
      const raw = row[colIdx];
      if (raw === null || raw === undefined) continue;
      const value = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(value) || value < 0.01) continue;
      rows.push({ year, from, to, tsIndex, value });
    }
  }

  const years = unique(rows.map((r) => r.year)).sort((a, b) => a - b);

  // Aggregate to annual GWh per (year, from, to)
  const sumMap = new Map<string, number>();
  for (const { year, from, to, value } of rows) {
    const key = `${year}|${from}|${to}`;
    sumMap.set(key, (sumMap.get(key) ?? 0) + value);
  }
  const annual: AnnualTrade[] = [];
  for (const [key, sum] of sumMap) {
    const [yearStr, from, to] = key.split('|');
    annual.push({ year: parseInt(yearStr), from, to, gwh: sum * TS_SCALE });
  }
  annual.sort((a, b) => a.year - b.year || a.from.localeCompare(b.from));

  return { rows, years, annual };
}

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
