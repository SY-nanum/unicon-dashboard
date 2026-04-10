# UNICON-Dashboard — Plan

| | |
|---|---|
| **Feature** | UNICON-Dashboard |
| **MVP Scope** | Industry sector, Process Mix chart, scenario overlay |
| **Level** | Dynamic (Next.js + bkend.ai, file-backed for MVP) |
| **Created** | 2026-04-05 |
| **Phase** | Plan |

---

## Executive Summary

| Perspective | Description |
|---|---|
| **Problem** | UNICON IAM project outputs live in sector-specific Excel files across 5 institutions. Policymakers can't compare scenarios (BAU vs NetZero vs Damage) without manual pivoting. The v2.1 report defines 30 target charts but none are implemented. |
| **Solution** | Next.js scenario-comparison dashboard that reads IAMC-format wide tables directly from `data/*.xlsx`, starting with Industry (SNU/steel) as the vertical slice. Overlay two scenarios on each chart to expose gaps visually. |
| **Function / UX Effect** | User picks 2 scenarios from a toggle bar → Industry Process Mix stacked bar chart redraws with both scenarios overlaid side-by-side (e.g., NetZero next to Historical bars for each year). Reveals structural shift from BF-BOF → EAF → H2-DRI at a glance. |
| **Core Value** | First visible proof that the 3-layer IAMC architecture works end-to-end. Unblocks the other 4 sectors and sets the UX/tech pattern for all 30 charts in v2.1. |

---

## Context Anchor

| Key | Value |
|---|---|
| **WHY** | Policymakers need scenario-comparison at-a-glance; 30 charts in v2.1 report have zero implementations. Industry-first because SNU data is ready and steel process transition (BF-BOF → H2-DRI) is the flagship story. |
| **WHO** | Primary: Yonsei PI + SNU researchers (internal validation). Secondary: policymakers (future). MVP has no auth — file-backed only. |
| **RISK** | (1) bkend.ai fit for IAMC wide/long pivot unknown — MVP sidesteps by reading file directly. (2) Scenario schema may evolve as BAU/Damage scenarios get calibrated — design for additive variables. (3) Chart library choice locks in extensibility for 29 remaining charts. |
| **SUCCESS** | 3 criteria met: chart renders from file, 2-scenario overlay works, add/remove variables without code changes to chart component. |
| **SCOPE** | IN: Industry Process Mix stacked bar, 2-scenario overlay, file-backed read, Korean UI, KOR region only. OUT: upload, auth, other sectors, GIS maps, waterfall/CBAM charts, regions beyond KOR, i18n. |

---

## 1. Overview

This is the **first PDCA cycle** of the UNICON-Dashboard multi-sector project. Rather than architecting all 30 charts upfront, we build one production-quality chart for the Industry sector (stacked bar of steel process capacity mix over time, with 2-scenario overlay) as a **vertical slice** that validates:

1. **IAMC parser** — can wide-format Excel (`Scenario | Region | Variable | Unit | 2020 | 2021 | ...`) be reliably pivoted into chart-ready long format?
2. **Scenario overlay UX** — is the side-by-side bar the right visual idiom for the v2.1 "gap analysis" philosophy, or do we need small-multiples?
3. **Extensibility** — can adding a new variable (e.g., `Capacity|Steel|H2-DRI`) or a new scenario (Damage) be done without touching React components?

Once validated, the same pattern scales to Power/Transport/Building charts. Forestry GIS tiles and Integrated GIS maps are deliberately deferred — different tech stack (tile server).

## 2. Requirements

### Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Read `data/SNU_Ind.xlsx` at server-side (Next.js API route or build-time), parse `Table_Ind_Tech_Mix` sheet |
| FR-02 | Pivot IAMC wide format → long format: rows `{scenario, region, variable, unit, year, value}` |
| FR-03 | Filter to `Variable LIKE 'Capacity|Steel|%'` — returns BF-BOF, EAF, H2-DRI capacity rows |
| FR-04 | Render stacked bar chart: X = year, Y = capacity (Mt), stack = process tech |
| FR-05 | Scenario toggle UI: user selects exactly 2 scenarios from available list (Historical, NetZero, others as data grows) |
| FR-06 | Overlay rendering: for each year, render two adjacent stacked bars (one per scenario) with visual distinction |
| FR-07 | Tooltip on hover: show `{scenario, year, tech, value, unit}` |
| FR-08 | Legend: tech colors (consistent across scenarios), scenario labels distinguished by bar position + subtle pattern/opacity |
| FR-09 | Korean UI text: chart title, axis labels, legend |

### Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Page initial load < 2s on dev machine (file is ~17KB, parse trivial) |
| NFR-02 | Data layer must be generic across sectors — no Industry-specific code paths in parser/chart |
| NFR-03 | Zero runtime cost to add new variables to the chart (data-driven) |
| NFR-04 | Chart library must support: stacked bar, grouped stacks, future scatter/line/heatmap (for other v2.1 charts) |

## 3. Success Criteria

| SC | Criterion | Measurement |
|---|---|---|
| SC-01 | Chart renders real data | Visit `/industry/process-mix`, see stacked bars with actual `SNU_Ind.xlsx` values (BF-BOF 48Mt, EAF 23.5Mt for 2020) |
| SC-02 | 2-scenario overlay works | Toggle Historical + NetZero → both render; switch to Historical-only → only one renders |
| SC-03 | Extensibility proven | Add a test row `Capacity|Steel|H2-DRI` to Excel → appears in chart without any TS/TSX edits |
| SC-04 | Korean labels present | Title "철강 공정 용량 믹스", axis "연도"/"용량 (Mt)", legend tech names shown |

## 4. Out of Scope (MVP)

- ❌ Other 5 sectors (Power/Transport/Building/Forestry/Integrated)
- ❌ Other chart types (waterfall, heatmap, duck curve, GIS maps)
- ❌ File upload UI — MVP reads from `data/` directly
- ❌ bkend.ai integration — deferred until we know if IAMC schema fits BaaS
- ❌ Authentication, user accounts, Public/Private data tagging
- ❌ Regions other than KOR
- ❌ Policy-maker-facing polish (filters, export, annotations)
- ❌ English/i18n (Korean only)
- ❌ Mobile responsive (desktop-first)

## 5. Open Questions for Design Phase

1. **Chart library**: Recharts (simple, React-native) vs Apache ECharts (30-chart coverage, incl. GIS) vs Plotly (scientific, used by PIK/IIASA). Trade-off: Recharts is lightest but may not cover waterfall/heatmap later → may force mid-project migration.
2. **Overlay rendering**: grouped stacks (2 bars per year) vs alpha-blended overlay vs small-multiples. v2.1 report implies gap visualization, suggesting grouped is clearest.
3. **Excel parser location**: build-time (static generation, fast, but requires rebuild on data update) vs runtime API route (slower, but hot-reload). Given weekly data refresh cadence, runtime API with in-memory cache probably wins.
4. **Scenario schema evolution**: current file has only Historical + NetZero. When BAU/Damage land, should the scenario picker be hard-coded or derived from distinct values in data? (Leaning: derived.)

## 6. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Chart library doesn't scale to all 30 v2.1 charts → migration cost | M | H | Design phase will validate library against 3-4 hardest charts (GIS flow map, heatmap 16×6, waterfall) before commit |
| IAMC wide-format has institutional variations (merged cells, footnotes) | M | M | Write parser defensively, add unit tests per sector file as they come online |
| Forestry GIS tile requirement may force architecture split (Next.js + tile server) | H | M | Deferred to later cycle; Industry MVP doesn't touch GIS |
| 2-scenario overlay becomes cluttered with >3 tech stacks | L | M | Monitor during implementation; fall back to small-multiples if needed |

## 7. Roadmap (Post-MVP)

| Cycle | Feature | Depends on |
|---|---|---|
| 1 (this) | Industry Process Mix | — |
| 2 | Industry full charts (Waterfall, CAPEX/OPEX, CBAM, Energy Intensity) | Cycle 1 chart library validated |
| 3 | Power sector (Generation Mix, Duck Curve, LCOE) | Cycle 1-2 pattern |
| 4 | Transport + Building | Cycle 3 |
| 5 | Integrated + Damage (incl. first GIS: Carbon price map) | tile server decision |
| 6 | Forestry (GIS-heavy, separate track) | tile server stack |
| 7 | Upload UI + bkend.ai migration | all sectors read-stable |

## 8. Dependencies

- **Input data**: `data/SNU_Ind.xlsx` (Table_Ind_Tech_Mix sheet) — ✅ exists, validated
- **Design reference**: `reports/UNICON 통합모형 시각화 방안 v2.1 (수송 숙대의견반영).docx` — ✅ read
- **No external services required** for MVP (no bkend.ai, no auth provider, no tile server)

---

*Next phase: `/pdca design UNICON-Dashboard`*
