/**
 * Prebuild script: converts ALL xlsx/csv files under data/ to JSON for Vercel deployment.
 * Run automatically via "prebuild" in package.json.
 * New data files added to data/ are picked up automatically.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dataDir = resolve(root, 'data');
const outDir = resolve(root, 'data-cache');

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// Recursively find all xlsx and csv files under data/
function findDataFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      // Skip GeoTIFF directories (too large, not tabular)
      if (!entry.startsWith('GeoTIFF')) findDataFiles(full, results);
    } else if (/\.(xlsx|csv)$/i.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

const files = findDataFiles(dataDir);
console.log(`[prepare-data] Found ${files.length} data files.`);

for (const absPath of files) {
  const relPath = relative(root, absPath).replace(/\\/g, '/');
  try {
    const buffer = readFileSync(absPath);
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
      const key = `${relPath}::${sheetName}`.replace(/[/\\:.]/g, '_');
      const outPath = resolve(outDir, `${key}.json`);
      writeFileSync(outPath, JSON.stringify(rows));
      console.log(`  ✓ ${relPath} → ${sheetName}`);
    }
  } catch (err) {
    console.warn(`  ✗ ${relPath}: ${err.message}`);
  }
}

console.log('[prepare-data] Done.');
