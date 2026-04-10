// Forestry — 임령 지도

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

export default async function AgeMapPage({
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
  if (countryMeta?.age_2024) {
    const { label: _, ...rest } = countryMeta.age_2024;
    layers.push({ key: '2024', label: `2024 ${t('map.actual', lang)}`, ...rest });
  }
  if (countryMeta?.age_2050) {
    const { label: _, ...rest } = countryMeta.age_2050;
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
            title={t('page.forestry.age-map', lang)}
            subtitle={t('page.forestry.age-map.sub', lang, { region: countryCode })}
            layers={layers}
            defaultLayer="2024"
            legendGradient="linear-gradient(to right, #b4763c, #7ab648, #16a34a, #14532d)"
          />
        )}
      </div>
      <p className="text-xs text-slate-400">Source: data/forest/GeoTIFF_Historical/{countryCode}_17Band_Historical.tif · Band: Age</p>
    </div>
  );
}
