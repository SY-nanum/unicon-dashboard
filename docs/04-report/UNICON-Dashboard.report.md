# UNICON-Dashboard — Completion Report

| | |
|---|---|
| **Feature** | UNICON-Dashboard (Industry Process Mix MVP) |
| **Status** | ✅ **Completed** |
| **Cycle duration** | 2026-04-05 (single day, 4 PDCA phases) |
| **Match Rate** | **98%** (≥ 90% threshold) |
| **Success Criteria** | **4/4 met** |

---

## Executive Summary

| | |
|---|---|
| **Feature** | UNICON-Dashboard (Industry Process Mix) |
| **Start → End** | 2026-04-05 Plan → 2026-04-05 Report |
| **Phases completed** | Plan → Design → Do (2 sessions) → Check → Report |

### Value Delivered (4 perspectives — actual results)

| Perspective | Delivered |
|---|---|
| **Problem** | 30 v2.1 report charts were unbuilt; policymakers had no way to compare UNICON IAM scenarios without manual Excel pivoting across 5 institutions. |
| **Solution** | Next.js 14 RSC page at `/industry/process-mix` reads SNU's `SNU_Ind_Submission.xlsx` server-side, pivots IAMC wide→long format, renders a 2-scenario overlay stacked bar chart via ECharts. Pattern established for the 29 remaining v2.1 charts. |
| **Function / UX Effect** | Users toggle 2 scenarios (max) from Historical/BAU/NetZero → chart re-renders showing steel process capacity shift: Historical 2020 (BF-BOF 48Mt, EAF 23.5Mt, DRI-H2 0Mt) vs NetZero 2025-2050 transition trajectory. Tooltip shows scenario · year · tech · value · unit on hover. |
| **Core Value** | First visible proof that the 3-layer IAMC architecture works end-to-end on real institution data. Generic IAMC parser + filter + chart primitives now unblock the Power/Transport/Building sectors with zero additional data-layer work. |

### Metrics

| Metric | Value |
|---|---|
| Files created | 23 (14 designed + 9 justified additions) |
| Source LOC (app/components/lib) | 603 |
| Unit tests | 16 / 16 passing |
| Match Rate | 98% (Structural 100% · Functional 100% · Contract N/A · Runtime 95%) |
| Success Criteria met | 4 / 4 |
| Critical gaps | 0 |
| Important gaps | 1 (Playwright L2/L3 — intentional deferral) |

---

## 1. Journey: PRD → Plan → Design → Do → Check

### 1.1 PRD phase
**Skipped.** The existing `reports/UNICON 통합모형 시각화 방안 v2.1 (수송 숙대의견반영).docx` (read via pypdf+python-docx during Plan checkpoint) served as de facto product discovery. It specified all 30 charts with purpose, graph form, data source, and IAMC file structure.

### 1.2 Plan phase (2026-04-05)
**Scope decision:** vertical slice — Industry sector only, single chart (Process Mix stacked bar), file-backed (deferred bkend.ai risk). User redirected broad "data viz app" scope to "Industry first" based on SNU data readiness and steel flagship narrative.

**Outputs:** `docs/01-plan/features/UNICON-Dashboard.plan.md` with 4 Success Criteria, Context Anchor, 9 FRs + 4 NFRs, 7-cycle roadmap (Industry → Power → Transport/Building → Integrated/Damage → Forestry/GIS → Upload+bkend migration).

### 1.3 Design phase (2026-04-05)
**3 options presented:** A Minimal (Recharts), B Clean (full abstraction), C Pragmatic (selected). Chart-library decision was the key lock-in — user selected **Option C: ECharts + generic IAMC parser + chart-pattern components** because Plan §5 explicitly required validating the library against all 30 v2.1 charts (Recharts fails waterfall/GIS). ECharts proven at IIASA/PIK for IAM viz.

**Outputs:** `docs/02-design/features/UNICON-Dashboard.design.md` with 7 architectural decisions (AD-1..AD-7), 14-file Module Map, 2-session plan, IamcRow long-format schema, test plan (unit + L1/L2/L3).

### 1.4 Do phase — Session 1 (scaffold + data-layer)
**Built:** Next.js 14 + Tailwind scaffold, `lib/iamc/{types,parser,load,filter}.ts` generic IAMC long-format pipeline with mtime cache.

**Bug caught:** `filter.ts` regex builder didn't escape `|`, causing `Capacity|Steel|*` to match everything via regex alternation. Smoke test against real xlsx surfaced it immediately.

**Exit criteria:** `npm install` ✓ · `tsc --noEmit` clean ✓ · `next dev` HTTP 200 ✓ · smoke test confirms BF-BOF 2020=48Mt from file.

### 1.5 Do phase — Session 2 (charts + page + tests)
**Built:** `StackedBar`, `ScenarioPicker`, `ScenarioOverlay`, `ProcessMixChart` (client), `app/industry/process-mix/page.tsx`, Vitest config + 3 test files (16 tests).

**Mid-session correction:** User pointed out real NetZero data lives in `data/industry/SNU_Ind_Submission.xlsx` — top-level `data/SNU_Ind.xlsx` is the empty template. Design doc path updated, memory saved for future sectors.

**Bug caught:** `ScenarioOverlay`'s render-prop `children(filtered, selected) => ReactNode` can't cross the RSC→Client boundary (functions aren't serializable). Extracted `ProcessMixChart` client wrapper that composes ScenarioOverlay + StackedBar internally with serializable props only.

### 1.6 Check phase
Static (structural + functional + contract) + Runtime (L0 unit tests + L1 HTTP probe). **Match Rate 98%.** Playwright L2/L3 deferred → single Important gap. User accepted current state.

## 2. Key Decisions & Outcomes

| # | Decision (source) | Rationale | Outcome |
|---|---|---|---|
| D1 | MVP = Industry sector only (Plan) | SNU data ready; steel BF-BOF→DRI-H2 flagship | ✅ Scope held, 1-day cycle |
| D2 | File-backed, skip bkend.ai (Plan) | Defer IAMC-vs-BaaS fit risk | ✅ Zero external deps; migration cleanly deferred to cycle 7 |
| D3 | ECharts over Recharts/Plotly (Design AD-1) | All 30 v2.1 charts coverage + IIASA precedent | ✅ Used for stacked bar; bundle 920KB (tree-shakable in prod build) |
| D4 | Server Component xlsx read (Design AD-2) | Keep 500KB SheetJS out of client bundle | ✅ Clean RSC pattern; `server-only` guard enforced |
| D5 | Long-format IamcRow (Design AD-3) | ECharts dataset API + future bkend GROUP BY queries | ✅ Generic pivot works across all IAMC sheets |
| D6 | Generic variable-pattern filter (Design §4.4) | SC-03 extensibility without component changes | ✅ Tested with 6 wildcard scenarios; adding vars requires zero code |
| D7 | Render-prop ScenarioOverlay (Design §4.6) | Flexible composition with any child chart | ⚠️ Required `ProcessMixChart` client wrapper to cross RSC boundary |
| D8 | 2-session split (Design §11.3) | Scaffold+data-layer green before UI | ✅ Session 1 exit criteria validated data layer independently |

## 3. Success Criteria — Final

| SC | Criterion | Status | Evidence |
|---|---|:---:|---|
| SC-01 | Chart renders real data | ✅ | `tests/iamc/load.test.ts:51` asserts BF-BOF 2020 Historical = 48 Mt from actual file; HTTP 200 on `/industry/process-mix` |
| SC-02 | 2-scenario overlay works | ✅ | `ScenarioPicker.tsx:14-24` enforces max=2 with FIFO replacement; `ProcessMixChart.tsx:38` activates groupKey='scenario' when 2 selected; both Historical+NetZero visible in SSR HTML |
| SC-03 | Add variable without code changes | ✅ | `filter.test.ts` 6 wildcard tests + `StackedBar.tsx:56` iterates data-discovered stacks (no hard-coded variable list anywhere) |
| SC-04 | Korean labels | ✅ | "철강 공정 용량 믹스", "시나리오", "용량 (Mt)", tech short labels BF-BOF/EAF/DRI-H2 all present |

**Success rate: 4/4 (100%)**

## 4. Deliverables

### Code
| Path | Purpose |
|---|---|
| `lib/iamc/{types,parser,load,filter}.ts` | Reusable IAMC data layer (200 LOC) |
| `components/charts/{StackedBar,ScenarioPicker,ScenarioOverlay,ProcessMixChart}.tsx` | Chart primitives (235 LOC) |
| `app/industry/process-mix/page.tsx` | First sector page (65 LOC) |
| `tests/iamc/{parser,filter,load}.test.ts` | 16 unit tests |
| `scripts/smoke-iamc.ts` | Dev-time xlsx verification |

### Docs
| Path | Artifact |
|---|---|
| `docs/01-plan/features/UNICON-Dashboard.plan.md` | Plan + Executive Summary + Context Anchor |
| `docs/02-design/features/UNICON-Dashboard.design.md` | Design + 7 ADs + Module Map + Session Guide |
| `docs/03-analysis/UNICON-Dashboard.analysis.md` | Gap analysis, 98% Match Rate |
| `docs/04-report/UNICON-Dashboard.report.md` | This report |

### Memory (future-session context)
- `memory/project_unicon.md` — project essentials, institutions, 3-layer architecture
- `memory/project_unicon_data_layout.md` — template vs submission file layout (key learning)
- `memory/user_role.md` — collaboration preferences

## 5. Lessons Learned

| # | Lesson | Application to future cycles |
|---|---|---|
| L1 | Real data file path matters — `data/*.xlsx` vs `data/{sector}/*_Submission.xlsx` differ by calibration status | For each new sector, check `data/{sector}/` subfolder for real submission before using top-level template |
| L2 | Regex special chars in domain syntax — `\|` needed escaping since IAMC uses pipe as separator | Any future DSL-to-regex translator: add full special-char escape list upfront, test with real separators |
| L3 | RSC→Client function props don't serialize | Render-prop components must live entirely on one side of the boundary; server→client props must be JSON-serializable |
| L4 | Smoke test against real data surfaces bugs faster than unit tests alone | Continue dev-time smoke tests per sector when loading new institution submissions |
| L5 | v2.1 report's 30-chart spec is a strong de-facto PRD | PM phase unneeded when upstream product doc is already this concrete; proceed directly to Plan |

## 6. Follow-up Work

| Priority | Item | Source |
|---|---|---|
| Later cycle | Playwright L2/L3 E2E tests | Analysis G1 (Important) |
| Next cycle | Industry cycle 2: Waterfall decomposition, CAPEX/OPEX bar, CBAM impact, Energy Intensity line | Plan §7 roadmap |
| Cycle 3 | Power sector (KEI hard-link data): generation mix, Duck Curve, LCOE | Plan §7 |
| Cycle 5 | First GIS chart (Carbon price flow map) — **tile server decision needed** | Plan §7 + v2.1 chart ③ |
| Cycle 7 | bkend.ai migration (replace file reads once all sectors stable) | Plan §7 |

## 7. How to Run

```bash
cd C:\Users\ysyna\Documents\unicon
npm install            # one-time
npm run dev            # http://localhost:3000/industry/process-mix
npm test               # 16 unit tests
npm run typecheck      # tsc --noEmit
```

---

**Cycle 1 complete.** Pattern established for the remaining 29 v2.1 charts.
