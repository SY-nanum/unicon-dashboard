/**
 * Prebuild script: converts xlsx files to JSON for Vercel deployment.
 * Run automatically via "prebuild" in package.json.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'data-cache');

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const FILES = [
  { file: 'data/industry/SNU_Ind_Submission.xlsx', sheets: ['Table_Ind_Tech_Mix', 'Table_Ind_Feedback'] },
];

for (const { file, sheets } of FILES) {
  const absPath = resolve(root, file);
  if (!existsSync(absPath)) {
    console.warn(`[prepare-data] File not found, skipping: ${file}`);
    continue;
  }

  const buffer = readFileSync(absPath);
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });

  for (const sheetName of sheets) {
    if (!wb.SheetNames.includes(sheetName)) {
      console.warn(`[prepare-data] Sheet "${sheetName}" not found in ${file}`);
      continue;
    }
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    const key = `${file}::${sheetName}`.replace(/[/\\:.]/g, '_');
    const outPath = resolve(outDir, `${key}.json`);
    writeFileSync(outPath, JSON.stringify(rows));
    console.log(`[prepare-data] Written: ${outPath}`);
  }
}

console.log('[prepare-data] Done.');
