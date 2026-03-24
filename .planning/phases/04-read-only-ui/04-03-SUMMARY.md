---
phase: 04-read-only-ui
plan: "03"
subsystem: ui
tags: [next.js, recharts, analytics, charts, client-component, typescript]
dependency_graph:
  requires:
    - phase: 04-01
      provides: [app-shell, globals-css, layout, page-rsc]
    - phase: 04-02
      provides: [employees-tab, employee-detail, balance-chip, tooltip]
  provides: [analytics-tab, kpi-cards, bar-charts, line-chart, forecast-table]
  affects: [04-04-test-and-verify]
tech_stack:
  added: []
  patterns: [client-component-charts, recharts-fixed-height, useMemo-analytics-pipeline]
key_files:
  created:
    - src/components/AnalyticsTab.tsx
  modified:
    - src/components/AppShell.tsx
    - src/components/EmployeesTab.tsx
key_decisions:
  - "recharts 2.x already installed (^2.15.4); no version change needed"
  - "All ResponsiveContainer heights fixed as numeric values (200/220) to avoid SSR issues"
  - "calculateEarnedDays(RESET_DATE, monthEnd) used for company-wide line chart aggregate — function accepts any Date as start, so RESET_DATE as company reference point works correctly"
  - "Rule 1 auto-fix: added [key: string]: unknown index signature to EmployeeRow in EmployeesTab.tsx to satisfy EmployeeDetail's EmployeeWithBalance type requirement"
patterns-established:
  - "Analytics data pipeline: employees/allRecords props -> useMemo chains -> recharts data arrays"
  - "Group filter pattern: useState groupFilter -> filteredEmployees memo -> all downstream memos"
requirements-completed: [UI-05]
duration: 4min
completed: "2026-03-24"
---

# Phase 04 Plan 03: AnalyticsTab with recharts Charts, KPIs, and Forecast Table Summary

**Full analytics dashboard ported to TypeScript with 4 recharts charts, 4 KPI cards, group filter (All/TOV/Deel), and a forecast date picker table — all wired into AppShell replacing the placeholder.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-24T14:27:13Z
- **Completed:** 2026-03-24T14:31:23Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `AnalyticsTab.tsx` (260 lines) ported from Electron JSX with TypeScript types
- All 4 recharts charts render with fixed numeric heights: monthly usage bar (200), year comparison bar (200), top-10 horizontal bar (220), earned vs used line (220)
- KPI cards, segmented group filter (All/TOV/Deel), and forecast table with date picker all functional
- AppShell updated to import and render AnalyticsTab with no more placeholder divs

## Task Commits

Each task was committed atomically:

1. **Task 1: Install recharts and create AnalyticsTab** - `16570a9` (feat)
2. **Task 2: Wire AnalyticsTab into AppShell** - `4ef9a11` (feat)

**Plan metadata:** (see final commit)

## Files Created/Modified

- `src/components/AnalyticsTab.tsx` - Full analytics dashboard: KPI cards, 4 recharts charts, group filter, forecast table
- `src/components/AppShell.tsx` - Added AnalyticsTab import; replaced analytics placeholder div
- `src/components/EmployeesTab.tsx` - Added index signature to EmployeeRow interface (Rule 1 auto-fix)

## Decisions Made

- recharts 2.x was already present in package.json (`^2.15.4`); no installation step needed
- All `ResponsiveContainer` use numeric `height` values rather than "100%" to ensure reliable rendering in Next.js SSR context
- `calculateEarnedDays(RESET_DATE, monthEnd)` in the line chart computes company-wide earned days since 2026-01-01; the web version's function signature accepts `Date` as first arg so this works as intended

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript index signature mismatch in EmployeesTab.tsx**
- **Found during:** Task 1 (build verification after creating AnalyticsTab.tsx)
- **Issue:** `EmployeeRow` interface lacked `[key: string]: unknown` index signature, causing TypeScript error when passing `emp` to `EmployeeDetail` which expects `EmployeeWithBalance` (which has that index signature)
- **Fix:** Added `[key: string]: unknown` to the `EmployeeRow` interface in `src/components/EmployeesTab.tsx`
- **Files modified:** src/components/EmployeesTab.tsx
- **Verification:** `npx next build` passed with no TypeScript errors after fix
- **Committed in:** 16570a9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in pre-existing 04-02 work)
**Impact on plan:** Fix was required to achieve a passing build. No scope creep.

## Issues Encountered

None beyond the auto-fixed type error.

## Next Phase Readiness

- Both EmployeesTab and AnalyticsTab are fully rendered from real Neon data
- AppShell has no more placeholder divs — all tabs functional
- Ready for 04-04: full test suite and human verification checkpoint

## Self-Check: PASSED

- src/components/AnalyticsTab.tsx — EXISTS
- src/components/AppShell.tsx — EXISTS (modified)
- src/components/EmployeesTab.tsx — EXISTS (modified)
- .planning/phases/04-read-only-ui/04-03-SUMMARY.md — EXISTS
- Commit 16570a9 — EXISTS
- Commit 4ef9a11 — EXISTS

---
*Phase: 04-read-only-ui*
*Completed: 2026-03-24*
