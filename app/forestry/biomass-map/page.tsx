// v2.1 Forestry ① — 산림 바이오매스 지도

import { Suspense } from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ForestMapViewer } from '@/components/charts/ForestMapViewer';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

interface MapMeta {
  file: string;
  bounds: { west: number; south: number; east: number; north: number };
  stats: { min: number; max: number; mean: number };
  unit: string;
  label: string;
}

function loadMeta(): Record<string, Record<string, MapMeta>> {
  const p = path.resolve(process.cwd(), 'public/maps/meta.json');
  return JSON.parse(readFileSync(p, 'utf-8'));
}

export default async function BiomassMapPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; lang?: string }>;
}) {
  const { region, lang: langParam } = await searchParams;
  const countryCode = region || 'KOR';
  const lang = (langParam as Lang) || DEFAULT_LANG;
  const meta = loadMeta();
  const countryMeta = meta[countryCode];

  const layers = [];
  if (countryMeta?.biomass_2024) {
    const { label: _, ...rest } = countryMeta.biomass_2024;
    layers.push({ key: '2024', label: `2024 ${t('map.actual', lang)}`, ...rest });
  }
  if (countryMeta?.biomass_2050) {
    const { label: _, ...rest } = countryMeta.biomass_2050;
    layers.push({ key: '2050', label: `2050 ${t('map.forecast', lang)}`, ...rest });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center"><Suspense fallback={null}><RegionSelector /></Suspense></div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        {layers.length === 0 ? (
          <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
        ) : (
          <ForestMapViewer
            title={t('page.forestry.biomass-map', lang)}
            subtitle={t('page.forestry.biomass-map.sub', lang, { region: countryCode })}
            layers={layers}
            defaultLayer="2024"
            legendGradient="linear-gradient(to right, #f0fdf4, #86efac, #22c55e, #15803d, #052e16)"
          />
        )}
      </div>
      <p className="text-xs text-slate-400">Source: data/forest/GeoTIFF_Historical/{countryCode}_17Band_Historical.tif · Band: Biomass</p>
    </div>
  );
}
