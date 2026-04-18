'use client';

// Forest GIS map viewer — displays pre-rendered GeoTIFF PNGs with legend + year toggle.

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

interface MapLayer {
  key: string;
  label: string;
  file: string;
  stats: { min: number; max: number; mean: number };
  unit: string;
  bounds: { west: number; south: number; east: number; north: number };
}

interface Props {
  title?: string;
  subtitle?: string;
  layers: MapLayer[];
  defaultLayer?: string;
  /** Color gradient CSS for legend bar */
  legendGradient: string;
}

export function ForestMapViewer({
  title,
  subtitle,
  layers,
  defaultLayer,
  legendGradient,
}: Props) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') as Lang) || DEFAULT_LANG;
  const [activeKey, setActiveKey] = useState(defaultLayer ?? layers[0]?.key ?? '');
  const active = layers.find((l) => l.key === activeKey) ?? layers[0];

  if (!active) {
    return <p className="py-12 text-center text-slate-400">{t('label.no-map-data', lang)}</p>;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        {title && (
          <div className="text-center flex-1">
            <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        )}

        {/* Layer toggle (when multiple layers, e.g. 2024 vs 2050) */}
        {layers.length > 1 && (
          <div className="inline-flex rounded-lg border-2 border-slate-400 bg-white p-1 shadow-sm">
            {layers.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setActiveKey(l.key)}
                className={
                  'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                  (l.key === activeKey
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100')
                }
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map image */}
      <div className="mt-4 border-t border-slate-200 pt-4">
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
          <Image
            src={active.file}
            alt={active.label}
            width={746}
            height={646}
            className="block w-full"
            style={{ imageRendering: 'pixelated' }}
            unoptimized
          />
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-slate-500">{active.stats.min.toFixed(0)}</span>
          <div
            className="h-3 flex-1 rounded-full"
            style={{ background: legendGradient }}
          />
          <span className="text-xs text-slate-500">{active.stats.max.toFixed(0)}</span>
          <span className="ml-2 text-xs text-slate-400">{active.unit}</span>
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {t('label.mean', lang)}: {active.stats.mean.toFixed(1)} {active.unit} ·
          {t('label.range', lang)}: {active.bounds.south.toFixed(1)}°N ~ {active.bounds.north.toFixed(1)}°N,
          {active.bounds.west.toFixed(1)}°E ~ {active.bounds.east.toFixed(1)}°E
        </div>
      </div>
    </div>
  );
}
