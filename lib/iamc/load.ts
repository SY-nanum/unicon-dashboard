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
 * Caches by {absPath, sheetName, mtime}. Invalidates automatically when the file changes.
 *
 * @param relativePath path relative to project root (process.cwd())
 * @param sheetName    sheet name inside the workbook
 */
export async function loadIamcSheet(
  relativePath: string,
  sheetName: string,
): Promise<IamcSheet> {
  const absPath = path.resolve(process.cwd(), relativePath);
  const cacheKey = `${absPath}::${sheetName}`;
  const { mtimeMs } = await stat(absPath);

  const cached = cache.get(cacheKey);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.sheet;
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

  const sheet = pivotWideToLong(wideRows, {
    sourceFile: relativePath,
    sheetName,
  });

  cache.set(cacheKey, { sheet, mtimeMs });
  return sheet;
}
