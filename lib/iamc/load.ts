// Design Ref: §4.3, AD-2, AD-4 — server-only Excel loader with mtime-based cache

import 'server-only';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { pivotWideToLong } from './parser';
import type { IamcSheet } from './types';

interface CacheEntry {
  sheet: IamcSheet;
  mtimeMs: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Load an IAMC sheet from an .xlsx file and pivot to long format.
 * On Vercel, falls back to pre-built JSON cache in data-cache/.
 */
export async function loadIamcSheet(
  relativePath: string,
  sheetName: string,
): Promise<IamcSheet> {
  const cacheKey = `${relativePath}::${sheetName}`;

  // Try pre-built JSON cache first (used in Vercel production)
  const cacheFileName = cacheKey.replace(/[/\\:.]/g, '_') + '.json';
  const jsonCachePath = path.resolve(process.cwd(), 'data-cache', cacheFileName);
  try {
    const jsonData = await readFile(jsonCachePath, 'utf-8');
    const wideRows = JSON.parse(jsonData) as unknown[][];
    const memCached = cache.get(cacheKey);
    if (memCached) return memCached.sheet;
    const sheet = pivotWideToLong(wideRows, { sourceFile: relativePath, sheetName });
    cache.set(cacheKey, { sheet, mtimeMs: 0 });
    return sheet;
  } catch {
    // JSON cache not found — fall through to xlsx
  }

  // Direct xlsx read (local dev)
  const absPath = path.resolve(process.cwd(), relativePath);
  const { mtimeMs } = await stat(absPath);

  const memCached = cache.get(cacheKey);
  if (memCached && (memCached as CacheEntry).mtimeMs === mtimeMs) {
    return memCached.sheet;
  }

  const buffer = await readFile(absPath);
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });

  if (!wb.SheetNames.includes(sheetName)) {
    throw new Error(
      `Sheet "${sheetName}" not found in ${relativePath}. Available: ${wb.SheetNames.join(', ')}`,
    );
  }

  const ws = wb.Sheets[sheetName];
  const wideRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
  });

  const sheet = pivotWideToLong(wideRows, { sourceFile: relativePath, sheetName });
  cache.set(cacheKey, { sheet, mtimeMs });
  return sheet;
}
