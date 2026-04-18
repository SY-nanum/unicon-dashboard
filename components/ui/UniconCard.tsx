'use client';

// UniconCard — content card shell (Design System: ui_kits/dashboard/Card.jsx)
// Accepts optional headerActions slot (e.g. RegionSelector, scenario chips)

interface UniconCardProps {
  title: string;
  subtitle?: string;
  source?: string;
  /** Rendered in the top-right of the header row (e.g. <RegionSelector />) */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function UniconCard({ title, subtitle, source, headerActions, children }: UniconCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header row: centered title/subtitle + optional right-side actions */}
      <div className="flex items-start gap-3">
        <div className="flex-1 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-slate-800">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {headerActions && (
          <div className="shrink-0">{headerActions}</div>
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
