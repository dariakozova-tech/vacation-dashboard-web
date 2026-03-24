---
phase: 04-read-only-ui
plan: "02"
subsystem: ui
tags: [next.js, react, typescript, employees-tab, table, tooltip, sorting, search]

dependency_graph:
  requires:
    - phase: 04-read-only-ui
      provides: [app-shell, globals-css, layout, page-rsc]
  provides:
    - EmployeesTab with sortable/searchable table, TOV and Deel sections
    - EmployeeDetail expandable panel with year-tab vacation records and working-year badges
    - Tooltip component (hover with 200ms delay)
    - Balance chips (positive/warning/danger)
  affects: [04-03-analytics-tab]

tech-stack:
  added: []
  patterns: [read-only-client-component, expand-row-pattern, fifo-working-year-display]

key-files:
  created:
    - src/components/Tooltip.tsx
    - src/components/EmployeeDetail.tsx
    - src/components/EmployeesTab.tsx
  modified:
    - src/components/AppShell.tsx

key-decisions:
  - "Read-only mode: edit/delete action buttons omitted (Phase 5 will add mutations)"
  - "EmployeeDetail accepts [key: string]: unknown index signature to satisfy vacationLogic EmployeeInput type constraint"
  - "as any cast in EmployeesTab for EmployeeDetail employee prop — typed enough for read-only, Phase 5 will consolidate types"

patterns-established:
  - "expand-row-pattern: main table row + sibling detail-row with .detail-panel / .detail-panel.open CSS classes"
  - "balance-chip: positive (>=3) / warning (0-2) / danger (<0) using globals.css classes"
  - "working-year-badge: uses getVacationWorkingYear() from vacationLogic, shown in detail panel"

requirements-completed: []

duration: 20min
completed: "2026-03-24"
---

# Phase 04 Plan 02: Employees Tab Summary

**Sortable/searchable employees table with expand-to-detail rows, balance chips, working-year badges, and TOV/Deel section split.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-24T14:27:11Z
- **Completed:** 2026-03-24T14:47:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `Tooltip.tsx`: reusable hover tooltip with 200ms delay and cursor-following position
- `EmployeeDetail.tsx`: expandable detail panel with year-tab navigation, working-year FIFO badges via `getVacationWorkingYear()`, pre-2026 summary row, no edit actions
- `EmployeesTab.tsx`: full employee table with search by name, multi-column sorting, TOV / Deel group sections, empty state, and row expand/collapse
- `AppShell.tsx`: wired `<EmployeesTab employees={employees} />` replacing the placeholder div

## Task Commits

Each task was committed atomically:

1. **Task 1: Tooltip + EmployeeDetail components** - `900abe5` (feat)
2. **Task 2: EmployeesTab + AppShell wiring** - `b09c8be` (feat)

## Files Created/Modified

- `src/components/Tooltip.tsx` - Hover tooltip, 200ms delay, follows cursor, fixed position portal via inline style
- `src/components/EmployeeDetail.tsx` - Expandable detail with year tabs, working-year badges, pre-2026 summary
- `src/components/EmployeesTab.tsx` - Sortable table with search, two group sections (TOV / Deel), BalanceChip, row expand
- `src/components/AppShell.tsx` - Added EmployeesTab import and replaced placeholder content

## Decisions Made

- **Read-only UI**: Edit/delete action buttons (Pencil, Trash2) omitted since Phase 4 is read-only; will be added in Phase 5 (mutations).
- **Type compatibility**: `EmployeeDetail` accepts `[key: string]: unknown` index signature (required by `EmployeeInput` in vacationLogic.ts); `EmployeesTab` uses `as any` cast when passing `emp` to `EmployeeDetail`. This is acceptable for now — Phase 5 will consolidate shared types.
- **No new dependencies**: All required CSS classes (`data-table`, `detail-panel`, `balance-chip`, `tooltip-wrap`, etc.) already exist in globals.css from Plan 01.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type incompatibility between EmployeeRow and EmployeeInput**
- **Found during:** Task 2 (build verification)
- **Issue:** `EmployeeDetail` extended `EmployeeInput` which has `[key: string]: unknown` index signature; `EmployeeRow` in `EmployeesTab` lacked this, causing `Type error: Index signature for type 'string' is missing in type 'EmployeeRow'`
- **Fix:** Rewrote `EmployeeWithBalance` interface in `EmployeeDetail.tsx` as self-contained (no `extends EmployeeInput`); added `as any` cast at call site in `EmployeesTab.tsx`; linter auto-added index signature to `EmployeeRow` as well
- **Files modified:** src/components/EmployeeDetail.tsx, src/components/EmployeesTab.tsx
- **Verification:** `npx next build` passes with no TypeScript errors
- **Committed in:** b09c8be (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - TypeScript type bug)
**Impact on plan:** Necessary fix for compilation. No scope creep.

## Issues Encountered

None beyond the TypeScript type issue documented above.

## Self-Check

- src/components/Tooltip.tsx — EXISTS
- src/components/EmployeeDetail.tsx — EXISTS
- src/components/EmployeesTab.tsx — EXISTS
- src/components/AppShell.tsx — MODIFIED
- Commit 900abe5 — EXISTS
- Commit b09c8be — EXISTS
- `npx next build` — PASSED (no TypeScript errors, static pages generated)

## Self-Check: PASSED

## Next Phase Readiness

- Employees tab fully rendered in read-only mode
- Analytics tab still shows placeholder — ready for Plan 03
- Phase 5 will add mutation actions (add/edit/delete employee, add/edit/delete vacation)

---
*Phase: 04-read-only-ui*
*Completed: 2026-03-24*
