'use client';

// Design Ref: §4.6 — Render-prop wrapper that owns scenario state + filters rows
// Plan SC-02: passes scenario-filtered rows to any child chart

import { useState } from 'react';
import { ScenarioPicker } from './ScenarioPicker';
import type { IamcRow } from '@/lib/iamc/types';

interface ScenarioOverlayProps {
  rows: IamcRow[];
  availableScenarios: string[];
  defaultSelected?: string[];
  max?: number;
  children: (filtered: IamcRow[], selected: string[]) => React.ReactNode;
}

export function ScenarioOverlay({
  rows,
  availableScenarios,
  defaultSelected,
  max = 2,
  children,
}: ScenarioOverlayProps) {
  const [selected, setSelected] = useState<string[]>(
    () => defaultSelected ?? availableScenarios.slice(0, Math.min(max, availableScenarios.length)),
  );

  const filtered = rows.filter((r) => selected.includes(r.scenario));

  return (
    <div className="space-y-4">
      <ScenarioPicker
        options={availableScenarios}
        value={selected}
        onChange={setSelected}
        max={max}
      />
      {children(filtered, selected)}
    </div>
  );
}
