# UNICON-Dashboard — Design

| | |
|---|---|
| **Feature** | UNICON-Dashboard (Industry Process Mix MVP) |
| **Architecture** | Option C — Pragmatic Balance |
| **Chart library** | Apache ECharts 5.x (covers all 30 v2.1 chart types) |
| **Created** | 2026-04-05 |
| **Phase** | Design |
| **Plan ref** | `docs/01-plan/features/UNICON-Dashboard.plan.md` |

---

## Context Anchor

| Key | Value |
|---|---|
| **WHY** | Policymakers can't compare BAU/NZ scenarios; 30 v2.1 charts unbuilt; steel process transition (BF-BOF → DRI-H2) is flagship scenario story |
| **WHO** | Yonsei PI + SNU researchers (internal); no auth MVP |
| **RISK** | Chart lib may not cover GIS/heatmap/waterfall; IAMC schema variations; scenario list may grow |
| **SUCCESS** | Chart renders real data, 2-scenario overlay works, new variables addable without code changes |
| **SCOPE** | IN: Industry Process Mix, KOR only, Korean UI. OUT: other sectors, upload, bkend.ai, auth, GIS, i18n |

---

## 1. Overview

Vertical-slice implementation of the **Industry Process Mix** stacked bar chart with 2-scenario overlay. Built as a Next.js 14 App Router page that reads `data/industry/SNU_Ind_Submission.xlsx` server-side, pivots IAMC wide format to long format, and passes filtered rows to a client ECharts component. Architecture establishes reusable primitives (`parser`, `<StackedBar>`, `<ScenarioOverlay>`, `<ScenarioPicker>`) for the 29 remaining v2.1 charts.

## 2. Architecture Overview

### 2.1 Layer structure

```
┌─────────────────────────────────────────────────────┐
│  app/industry/process-mix/page.tsx  (RSC)           │
│  • Calls loadIamcSheet() server-side                │
│  • Filters variables via pattern                    │
│  • Renders <ScenarioOverlay><StackedBar/></>        │
└─────────────────────────────────────────────────────┘
              │ (server-side)          │ (props)
              ▼                        ▼
┌──────────────────────────┐  ┌──────────────────────┐
│  lib/iamc/ (Data layer)  │  │  components/charts/  │
│  • parser.ts wide→long   │  │  (Presentation)      │
│  • load.ts fs+cache      │  │  • StackedBar.tsx    │
│  • types.ts IamcRow      │  │  • ScenarioOverlay   │
│  • filter.ts pattern     │  │  • ScenarioPicker    │
└──────────────────────────┘  └──────────────────────┘
              │
              ▼
     data/industry/SNU_Ind_Submission.xlsx (read-only source)
```

### 2.2 Key architectural decisions

| # | Decision | Rationale |
|---|---|---|
| AD-1 | **ECharts (not Recharts/Plotly)** | Proven at IIASA/PIK for IAM viz; supports all 30 v2.1 charts incl. GIS flow maps, waterfall, heatmap. Plan §5 Q1 validated. |
| AD-2 | **Server Component reads xlsx** | No client-side file parsing (SheetJS would add ~500KB to bundle). Node `xlsx` package runs server-side only. Excel file path resolved via `process.cwd()`. |
| AD-3 | **Long format internally** | `{scenario, region, variable, unit, year, value}` one-row-per-datapoint — matches ECharts dataset API and future GROUP BY queries when bkend.ai migration happens. |
| AD-4 | **In-memory cache by file mtime** | File is ~17KB and parse is <10ms, but cache avoids re-read on every request in dev. Invalidated when mtime changes (hot reload of data). |
| AD-5 | **Scenario picker drives client state only** | Server passes all filtered rows; client filters to selected 2 scenarios. Avoids round-trips on toggle. |
| AD-6 | **ECharts via `echarts-for-react`** | Maintained wrapper, SSR-safe with `dynamic(import, ssr: false)`. |
| AD-7 | **No state library (Zustand/Redux)** | MVP has one page, one picker state — `useState` suffices. Add Zustand at cycle 3 if cross-page scenario persistence needed. |

## 3. Data Model

### 3.1 IAMC wide format (source)

```
| Model   | Scenario  | Region | Variable             | Unit | 2020 | 2021 | ... | 2050 | Remark |
|---------|-----------|--------|----------------------|------|------|------|-----|------|--------|
| SNU_Ind | Historical| KOR    | Capacity|Steel|BF-BOF| Mt   | 48.0 | 47.5 | ... | null | ...    |
| SNU_Ind | NetZero   | KOR    | Capacity|Steel|BF-BOF| Mt   | null | null | ... | 2.0  | ...    |
```

### 3.2 IamcRow (internal long format)

```typescript
// lib/iamc/types.ts
export interface IamcRow {
  model: string;        // "SNU_Ind"
  scenario: string;     // "Historical" | "BAU" | "NetZero"
  region: string;       // "KOR"
  variable: string;     // "Capacity|Steel|BF-BOF"
  unit: string;         // "Mt"
  year: number;         // 2020
  value: number;        // 48.0
  remark?: string;
}

export interface IamcSheet {
  rows: IamcRow[];
  years: number[];           // sorted unique years seen
  scenarios: string[];       // distinct scenarios
  variables: string[];       // distinct variables
  regions: string[];
  sourceFile: string;
  parsedAt: Date;
}
```

### 3.3 Parser contract

```typescript
// lib/iamc/parser.ts
/**
 * Pivots IAMC wide-format rows to long format.
 * Skips rows where scenario/variable/region is blank.
 * Skips cells where value is null/undefined (not-yet-calibrated).
 */
export function pivotWideToLong(wideRows: unknown[][]): IamcRow[];
```

## 4. Module Specifications

### 4.1 `lib/iamc/types.ts`
- Exports: `IamcRow`, `IamcSheet`, `ScenarioColor`
- ~25 lines

### 4.2 `lib/iamc/parser.ts`
- `pivotWideToLong(wideRows)`: pivots header-based wide to long
- Header detection: first row with `'Model'` at index 0
- Year columns: numeric headers only
- Filter: skip rows with blank scenario OR blank variable
- Skip: null values (not-yet-calibrated cells)
- ~50 lines

### 4.3 `lib/iamc/load.ts`
- `loadIamcSheet(filePath, sheetName): Promise<IamcSheet>`
- Uses `xlsx` npm package
- In-memory cache keyed by `{filePath, sheetName, mtime}`
- Server-only (`import 'server-only'`)
- ~40 lines

### 4.4 `lib/iamc/filter.ts`
- `filterByVariablePattern(rows, pattern: string): IamcRow[]`
- Pattern uses `|` as literal separator, `*` as wildcard segment
- Example: `"Capacity|Steel|*"` matches BF-BOF, EAF, DRI-H2
- ~20 lines

### 4.5 `components/charts/StackedBar.tsx`
- Props: `{ rows: IamcRow[], stackKey: 'variable', groupKey?: 'scenario', title?: string, yAxisLabel?: string }`
- Client component (`'use client'`)
- Builds ECharts option from long-format rows
- When `groupKey` set → grouped stacks (2 bars per year)
- ~80 lines

### 4.6 `components/charts/ScenarioOverlay.tsx`
- Props: `{ rows: IamcRow[], availableScenarios: string[], children: (filtered, selected) => ReactNode }`
- Render-prop pattern: renders `<ScenarioPicker>` + chart
- Owns scenario selection state (`useState`)
- Filters rows to currently selected scenarios
- ~40 lines

### 4.7 `components/charts/ScenarioPicker.tsx`
- Props: `{ options: string[], value: string[], onChange, max?: number = 2 }`
- Horizontal chip toggles
- Enforces max=2 (clicking 3rd deselects oldest)
- ~30 lines

### 4.8 `app/industry/process-mix/page.tsx`
- RSC
- `loadIamcSheet('data/industry/SNU_Ind_Submission.xlsx', 'Table_Ind_Tech_Mix')`
- `filterByVariablePattern(rows, 'Capacity|Steel|*')`
- Renders `<ScenarioOverlay>{filtered, selected => <StackedBar .../>}</ScenarioOverlay>`
- ~30 lines

## 5. UI Specification

### 5.1 Page layout
```
┌──────────────────────────────────────────────────┐
│  UNICON | 산업 부문                               │  ← simple header
├──────────────────────────────────────────────────┤
│  철강 공정 용량 믹스                              │  ← H1
│  시나리오 비교: BF-BOF / EAF / DRI-H2             │  ← subtitle
├──────────────────────────────────────────────────┤
│  [Historical ✓] [BAU] [NetZero ✓]                │  ← ScenarioPicker
├──────────────────────────────────────────────────┤
│                                                  │
│           [ECharts stacked grouped bars]         │
│           Y: 용량 (Mt)  X: 연도                   │
│           2 bars per year × stacked techs        │
│                                                  │
├──────────────────────────────────────────────────┤
│  Tech 범례: ■ BF-BOF ■ EAF ■ DRI-H2              │
│  Source: data/industry/SNU_Ind_Submission.xlsx · Parsed: 2026-04-05  │
└──────────────────────────────────────────────────┘
```

### 5.2 Color palette (tech consistency across scenarios)

| Tech | Color | Rationale |
|---|---|---|
| BF-BOF | `#4a5568` (slate) | "Old" / carbon-intensive |
| EAF | `#3182ce` (blue) | Transitional |
| DRI-H2 | `#38a169` (green) | "New" / clean |

Scenarios distinguished by **bar grouping position** (Historical on left, NetZero on right). No opacity changes — readability > aesthetic.

### 5.3 Interaction
- Tooltip on bar hover: `{scenario} · {year} · {tech}: {value} Mt`
- Click scenario chip: toggle; if already 2 selected and clicking 3rd → deselect oldest
- No chart interactions beyond tooltip in MVP

## 6. File Structure

```
unicon/
├── app/
│   ├── industry/
│   │   └── process-mix/
│   │       └── page.tsx                    [NEW]
│   ├── layout.tsx                          [NEW]
│   └── globals.css                         [NEW]
├── components/
│   └── charts/
│       ├── StackedBar.tsx                  [NEW]
│       ├── ScenarioOverlay.tsx             [NEW]
│       └── ScenarioPicker.tsx              [NEW]
├── lib/
│   └── iamc/
│       ├── types.ts                        [NEW]
│       ├── parser.ts                       [NEW]
│       ├── load.ts                         [NEW]
│       └── filter.ts                       [NEW]
├── data/                                   [EXISTS]
│   └── SNU_Ind.xlsx
├── package.json                            [NEW]
├── next.config.mjs                         [NEW]
├── tsconfig.json                           [NEW]
└── tailwind.config.ts                      [NEW]
```

**New files: 13** · **Modified: 0** · **Estimated LOC: ~400**

## 7. Dependencies

| Package | Version | Purpose |
|---|---|---|
| next | ^14.2 | App Router, RSC |
| react | ^18 | — |
| typescript | ^5 | — |
| echarts | ^5.5 | Chart rendering |
| echarts-for-react | ^3.0 | React wrapper (SSR-safe with dynamic import) |
| xlsx | ^0.18 | Server-side Excel parsing (`SheetJS`) |
| tailwindcss | ^3.4 | Styling |

## 8. Test Plan

### 8.1 Unit tests (Vitest)

| Target | Test |
|---|---|
| `parser.pivotWideToLong` | Given 3-row × 4-year fixture → returns 12 IamcRows |
| `parser.pivotWideToLong` | Skips rows with blank scenario |
| `parser.pivotWideToLong` | Skips null values (not-yet-calibrated) |
| `filter.filterByVariablePattern` | `"Capacity|Steel|*"` matches 3 techs, excludes emissions |
| `filter.filterByVariablePattern` | Exact match `"Production|Steel|Total"` |
| `load.loadIamcSheet` | Cache hit on second call without mtime change |
| `load.loadIamcSheet` | Cache miss when file mtime changes |

### 8.2 Integration / E2E

| Scenario | Expected |
|---|---|
| Visit `/industry/process-mix` | Page renders, chart SVG present |
| Load with Historical+NetZero selected | 2 bars per year group, 3 tech stacks each |
| Click BAU chip while Historical+NetZero selected | Historical (oldest) deselects, BAU+NetZero active |
| Hover 2030 NetZero BF-BOF bar | Tooltip shows `NetZero · 2030 · BF-BOF: {value} Mt` |
| Add row `Capacity|Steel|FAKE` to xlsx, reload | New stack appears without code changes (SC-03) |

### 8.3 Manual verification checklist

- [ ] KOR region label hidden (only region in data, not informative)
- [ ] Korean title renders correctly
- [ ] Years axis shows irregular intervals (2020, 2021, 2022, 2025, 2030, ...)
- [ ] Tech color legend matches spec (slate/blue/green)
- [ ] Source footer shows correct parsed timestamp

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `xlsx` package has known security CVEs | Pin to ^0.20.2 (patched); document; consider ExcelJS migration if upload added |
| ECharts bundle size (~900KB) | Use tree-shaking via `echarts/core` + register only needed components |
| SSR hydration mismatch for charts | `dynamic(() => import, { ssr: false })` wrapper |
| Null values in NetZero rows 2020-2022 (not-yet-calibrated) | Parser skips them; ECharts gaps gracefully in bars |

## 10. Non-Goals (reconfirmed)

- No API routes in MVP (RSC reads file directly)
- No error boundary beyond Next.js default
- No export (CSV/PNG)
- No accessibility audit (policy audience is internal research first)

## 11. Implementation Guide

### 11.1 Order

1. Project scaffold (package.json, tsconfig, next.config, tailwind, layout, globals)
2. IAMC data layer (types → parser → load → filter) + unit tests
3. Chart primitives (StackedBar → ScenarioPicker → ScenarioOverlay)
4. Page assembly (app/industry/process-mix/page.tsx)
5. Manual QA + Korean label polish

### 11.2 Dependency install commands

```bash
npm init -y
npm install next@^14.2 react@^18 react-dom@^18 echarts@^5.5 echarts-for-react@^3.0 xlsx@^0.18.5
npm install -D typescript@^5 @types/react @types/node tailwindcss@^3.4 postcss autoprefixer vitest
npx tailwindcss init -p
```

### 11.3 Session Guide

**Module Map:**

| Scope key | Modules | Files | LOC | Depends on |
|---|---|---|---|---|
| `scaffold` | Project bootstrap | package.json, tsconfig.json, next.config.mjs, tailwind.config.ts, app/layout.tsx, app/globals.css | ~80 | — |
| `data-layer` | IAMC parser + loader | lib/iamc/{types,parser,load,filter}.ts | ~135 | scaffold |
| `charts` | Chart components | components/charts/{StackedBar,ScenarioOverlay,ScenarioPicker}.tsx | ~150 | scaffold |
| `page` | Route assembly | app/industry/process-mix/page.tsx | ~30 | data-layer, charts |
| `tests` | Unit tests | tests/iamc/{parser,filter,load}.test.ts | ~80 | data-layer |

**Recommended session plan:**

- **Session 1** (scaffold + data-layer): `/pdca do UNICON-Dashboard --scope scaffold,data-layer` — gets to `npm run dev` + green unit tests
- **Session 2** (charts + page + tests): `/pdca do UNICON-Dashboard --scope charts,page,tests` — first visual result + test coverage
- Or single-session: `/pdca do UNICON-Dashboard` (2-3 hours)

---

*Next phase: `/pdca do UNICON-Dashboard`*
