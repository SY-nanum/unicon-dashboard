// v2.1 Forestry ④ — 지위지수 지도

import { Suspense } from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ForestMapViewer } from '@/components/charts/ForestMapViewer';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { UniconCard } from '@/components/ui/UniconCard';
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

export default async function SiteIndexMapPage({
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
  if (countryMeta?.siteindex) {
    const { label: _, ...rest } = countryMeta.siteindex;
    layers.push({ key: 'siteindex', label: t('map.site-index', lang), ...rest });
  }

  return (
    <UniconCard
      title={t('page.forestry.site-index', lang)}
      subtitle={t('page.forestry.site-index.sub', lang, { region: countryCode })}
      source={`data/forest/GeoTIFF_Historical/${countryCode}_17Band_Historical.tif · Band: SiteIndex`}
      headerActions={<Suspense fallback={null}><RegionSelector /></Suspense>}
    >
      {layers.length === 0 ? (
        <p className="py-12 text-center text-slate-400">{countryCode} {t('ui.placeholder', lang)}</p>
      ) : (
        <>
          <ForestMapViewer
            layers={layers}
            legendGradient="linear-gradient(to right, #3b82f6, #8b5cf6, #ef4444)"
          />
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-800">Site Index</span> — {t('page.forestry.site-index.desc', lang)}</p>
            <p className="mt-2 text-xs text-slate-500">{t('page.forestry.site-index.note', lang)}</p>
          </div>
        </>
      )}
    </UniconCard>
  );
}
