'use client';

// UniconCard — content card shell (Design System: ui_kits/dashboard/Card.jsx)
// Title centered, optional subtitle, optional region select, source footer.

import { UniconRegionSelect } from './UniconRegionSelect';

interface UniconCardProps {
  title: string;
  subtitle?: string;
  source?: string;
  region?: string;
  onRegion?: (r: string) => void;
  children: React.ReactNode;
}

export function UniconCard({ title, subtitle, source, region, onRegion, children }: UniconCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header row: centered title + optional region select */}
      <div className="flex items-start gap-3">
        <div className="flex-1 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-slate-800">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {region && onRegion && (
          <UniconRegionSelect value={region} onChange={onRegion} />
        )}
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-slate-200" />

      {/* Chart area */}
      {children}

      {/* Source footer */}
      {source && (
        <p className="mt-3 font-mono text-[11px] text-slate-400">Source: {source}</p>
      )}
    </section>
  );
}
