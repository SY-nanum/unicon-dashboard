// Smoke test: verify parser + filter on real data.
// Reads xlsx directly to bypass the 'server-only' guard in load.ts (which requires a Next.js RSC context).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { pivotWideToLong } from '../lib/iamc/parser';
import { filterByVariablePattern } from '../lib/iamc/filter';

async function main() {
  const absPath = path.resolve(process.cwd(), 'data/SNU_Ind.xlsx');
  const buf = readFileSync(absPath);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false });
  const ws = wb.Sheets['Table_Ind_Tech_Mix'];
  const wideRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });

  const sheet = pivotWideToLong(wideRows, {
    sourceFile: 'data/SNU_Ind.xlsx',
    sheetName: 'Table_Ind_Tech_Mix',
  });

  console.log('--- Sheet summary ---');
  console.log('  rows:', sheet.rows.length);
  console.log('  scenarios:', sheet.scenarios);
  console.log('  variables:', sheet.variables);
  console.log('  years:', sheet.years);
  console.log('  regions:', sheet.regions);
  console.log('  units:', sheet.units);

  const capacity = filterByVariablePattern(sheet.rows, 'Capacity|Steel|*');
  console.log('\n--- Capacity|Steel|* filter ---');
  console.log('  matched rows:', capacity.length);
  console.log('  distinct variables:', [...new Set(capacity.map((r) => r.variable))]);
  console.log('  2020 Historical sample:');
  console.table(
    capacity
      .filter((r) => r.year === 2020 && r.scenario === 'Historical')
      .map(({ scenario, variable, year, value, unit }) => ({ scenario, variable, year, value, unit })),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
