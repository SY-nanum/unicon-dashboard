'use client';

// Design Ref: §4.7 — Scenario chip picker, enforces max 2 selections
// Plan SC-02: 2-scenario overlay relies on this picker's max=2 constraint

import { useSearchParams } from 'next/navigation';
import { t, DEFAULT_LANG } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

interface ScenarioPickerProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

export function ScenarioPicker({ options, value, onChange, max = 2 }: ScenarioPickerProps) {
  const searchParams = useSearchParams();
  const lang = (searchParams.get('lang') as Lang) || DEFAULT_LANG;
  function toggle(scenario: string) {
    if (value.includes(scenario)) {
      onChange(value.filter((v) => v !== scenario));
      return;
    }
    // When at capacity, drop the oldest selection (value[0]) to make room
    if (value.length >= max) {
      onChange([...value.slice(1), scenario]);
      return;
    }
    onChange([...value, scenario]);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-600">{t('picker.scenario', lang)}</span>
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={
              'rounded-full border-2 px-3 py-1 text-sm transition ' +
              (active
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-400 bg-white text-slate-700 hover:border-slate-500')
            }
          >
            {opt}
          </button>
        );
      })}
      <span className="ml-2 text-xs text-slate-400">{t('picker.max', lang, { n: String(max) })}</span>
    </div>
  );
}
