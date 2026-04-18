'use client';

// Client wrapper: owns scenario selection state + timeline merging.
// Renders as a self-contained card: title row (title left, scenario menu right) + chart body.

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Percent100StackedWithTrend } from './Percent100StackedWithTrend';
import { RegionSelector } from '@/components/layout/RegionSelector';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import type { IamcRow } from '@/lib/iamc/types';

interface Props {
  title?: string;
  subtitle?: string;
  rows: IamcRow[];
  projectionScenarios: string[];
  defaultScenario: string;
  projectionCutoff: number;
  stackOrder: string[];
  stackColors: Record<string, string>;
  /** Footer / data-legend row */
  footer?: React.ReactNode;
}

function useScenarioMeta(lang: Lang) {
  return {
    BAU: { subtitle: t('scenario.bau', lang), hint: t('scenario.bau.hint', lang) },
    NetZero: { subtitle: t('scenario.netzero', lang), hint: t('scenario.netzero.hint', lang) },
  } as Record<string, { subtitle: string; hint: string }>;
}

export function ProcessMixChart({
  title,
  subtitle,
  rows,
  projectionScenarios,
  defaultScenario,
  projectionCutoff,
  stackOrder,
  stackColors,
  footer,
}: Props) {
  const [selected, setSelected] = useState<string>(defaultScenario);

  const { displayRows, hasData } = useMemo(() => {
    const historical = rows.filter(
      (r) => r.scenario === 'Historical' && r.year < projectionCutoff,
    );
    const projection = rows.filter(
      (r) => r.scenario === selected && r.year >= projectionCutoff,
    );
    return {
      displayRows: [...historical, ...projection],
      hasData: projection.length > 0,
    };
  }, [rows, selected, projectionCutoff]);

  const scenarioAvailability = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const s of projectionScenarios) {
      map[s] = rows.some((r) => r.scenario === s && r.year >= projectionCutoff);
    }
    return map;
  }, [rows, projectionScenarios, projectionCutoff]);

  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') as Lang) || DEFAULT_LANG;
  const SCENARIO_META = useScenarioMeta(lang);
  const activeHint = SCENARIO_META[selected]?.hint;

  return (
    <div>
      {/* Region (left) + Scenario (right) — same row */}
      <div className="flex items-center gap-3">
        <Suspense fallback={null}>
          <RegionSelector />
        </Suspense>
        <div className="flex-1" />
        <div className="shrink-0">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('ui.scenario', lang)}</div>
          {activeHint && (
            <div className="text-xs text-slate-400">{activeHint}</div>
          )}
        </div>
        <div
          role="radiogroup"
          aria-label={t('ui.scenario', lang)}
          className="inline-flex rounded-lg border-2 border-slate-400 bg-white p-1 shadow-sm"
        >
          {projectionScenarios.map((scenario) => {
            const active = scenario === selected;
            const available = scenarioAvailability[scenario];
            const meta = SCENARIO_META[scenario];
            return (
              <button
                key={scenario}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => available && setSelected(scenario)}
                disabled={!available}
                className={
                  'min-w-[140px] rounded-md px-4 py-2 text-left transition ' +
                  (active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : available
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'cursor-not-allowed text-slate-300')
                }
                title={available ? meta?.hint : t('footer.data-pending', lang)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{scenario}</span>
                  {!available && (
                    <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {t('footer.data-pending', lang)}
                    </span>
                  )}
                  {active && (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {meta && (
                  <div
                    className={
                      'mt-0.5 text-[11px] ' +
                      (active
                        ? 'text-blue-100'
                        : available
                          ? 'text-slate-500'
                          : 'text-slate-300')
                    }
                  >
                    {meta.subtitle}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title — centered, below scenario selector (omitted when UniconCard provides the title) */}
      {title && (
        <div className="mt-3 text-center">
          <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}

      {/* Optional footer legend (Historical / Projection ranges) */}
      {footer && <div className="mt-3">{footer}</div>}

      {/* Chart area — flat, top border separator only */}
      <div className="mt-4 border-t border-slate-200 pt-4">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="mb-3 h-10 w-10 text-slate-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm text-slate-500">
              <span className="font-medium">{selected}</span> {t('footer.data-pending', lang)}
            </p>
          </div>
        ) : (
          <Percent100StackedWithTrend
            rows={displayRows}
            stackKey="variable"
            stackOrder={stackOrder}
            stackColors={stackColors}
            trendLines={true}
            mode="absolute"
            projectionCutoff={projectionCutoff}
          />
        )}
      </div>
    </div>
  );
}
