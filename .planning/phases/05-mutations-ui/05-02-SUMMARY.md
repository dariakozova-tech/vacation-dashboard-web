---
phase: 05-mutations-ui
plan: 02
subsystem: ui
tags: [react, typescript, next.js, server-actions, useRouter, useTransition, lucide-react]

# Dependency graph
requires:
  - phase: 05-mutations-ui plan 01
    provides: EmployeeModal, VacationModal, ConfirmDialog — pure form modal components with onSave/onClose callbacks
  - phase: 02-schema-services-and-actions
    provides: addEmployeeAction, updateEmployeeAction, deleteEmployeeAction, addVacationRecordAction, updateVacationRecordAction, deleteVacationRecordAction
  - phase: 04-read-only-ui
    provides: AppShell, EmployeesTab, EmployeeDetail, row-actions/btn-icon/btn-danger CSS classes
provides:
  - AppShell: modal state manager with all 6 Server Action handlers and router.refresh() wiring
  - EmployeesTab: edit/delete action buttons on employee rows (hover-reveal via .row-actions)
  - EmployeeDetail: "Додати відпустку" button and edit/delete per vacation record row
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AppShell-as-mutation-hub: single component holds modal open/close state and all Server Action calls
    - router.refresh() (not router.push) for post-mutation data reload — preserves expanded row and search state
    - useTransition wraps router.refresh() to avoid suspending the entire tree
    - Guard record.id != null before calling onDeleteVacation — VacationRecordInput.id is optional
    - eslint-disable-next-line any cast for VacationRecordInput → VacationModal record prop (id optional vs required mismatch)

key-files:
  created: []
  modified:
    - src/components/AppShell.tsx
    - src/components/EmployeesTab.tsx
    - src/components/EmployeeDetail.tsx

key-decisions:
  - "AppShell is the single mutation state manager — EmployeesTab and EmployeeDetail are pure display components that bubble callbacks up"
  - "router.refresh() used (not router.push('/')) to preserve client state (expanded row, search query, active tab) after mutations"
  - "VacationRecordInput.id is optional (type definition); guard with != null check before calling onDeleteVacation to satisfy TypeScript"
  - "Topbar 'Додати' button shown only on employees tab (conditional render) to avoid confusion on analytics tab"

patterns-established:
  - "Pattern: AppShell as mutation hub — holds all modal state, calls Server Actions, triggers router.refresh()"
  - "Pattern: Callback chain: button click -> EmployeeDetail/EmployeesTab -> AppShell handler -> Server Action -> router.refresh()"
  - "Pattern: useTransition wraps router.refresh() — avoids blocking UI while refresh is in-flight"

requirements-completed: [UI-08, UI-09, UI-10, UI-11, UI-12, UI-14]

# Metrics
duration: 10min
completed: 2026-03-25
---

# Phase 5 Plan 02: Mutations UI — Action Wiring Summary

**Full CRUD wiring: AppShell manages all modal state and Server Action calls, EmployeesTab adds hover edit/delete buttons per employee row, EmployeeDetail adds "Додати" vacation button and edit/delete per record, all mutations trigger router.refresh()**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-25T09:20:00Z
- **Completed:** 2026-03-25T09:30:00Z
- **Tasks:** 2 completed
- **Files modified:** 3 modified

## Accomplishments
- AppShell now owns all modal state (employeeModal, vacationModal, confirmDialog, actionError) and all 6 Server Action handlers
- "Додати" button in topbar triggers EmployeeModal in add mode; router.refresh() after every successful mutation
- EmployeesTab employee rows show edit (Pencil) and delete (Trash2) buttons on hover via .row-actions CSS
- EmployeeDetail "Відпустки" header shows "Додати" button; each vacation record row has edit/delete action buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire AppShell with modal state, Server Action handlers, router.refresh()** - `1ffc5f2` (feat)
2. **Task 2: Add action buttons to EmployeesTab and EmployeeDetail** - `5ed26f7` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `/Users/dariakozova/Documents/vacation-dashboard-web/src/components/AppShell.tsx` - Tightened props types, added modal state, all 6 Server Action handlers, useRouter/useTransition, "Додати" button in topbar, modal renders at bottom of JSX
- `/Users/dariakozova/Documents/vacation-dashboard-web/src/components/EmployeesTab.tsx` - Added EmployeesTabProps with 6 mutation callbacks, Pencil/Trash2 action buttons per employee row, empty <th> header, updated colSpan from +1 to +2
- `/Users/dariakozova/Documents/vacation-dashboard-web/src/components/EmployeeDetail.tsx` - Added onAddVacation/onEditVacation/onDeleteVacation optional props, "Додати" button in header, action buttons per vacation record in both single-year and "all" view, updated colSpan from 5 to 6

## Decisions Made
- AppShell is the single mutation state manager — keeps EmployeesTab and EmployeeDetail as pure display components that bubble events up via callbacks
- router.refresh() instead of router.push('/') to preserve expanded row, search query, and active tab after mutation
- VacationRecordInput.id is optional (per type definition in vacationLogic.ts); added `record.id != null` guard to satisfy TypeScript and avoid runtime errors
- Topbar "Додати" button only shown when activeTab === 'employees' to avoid confusion on the analytics tab

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added index signature to AppShell EmployeeRow interface**
- **Found during:** Task 1 (AppShell modification)
- **Issue:** AppShell defined EmployeeRow without `[key: string]: unknown`, while EmployeesTab's EmployeeRow had it — TypeScript rejected the assignment
- **Fix:** Added `[key: string]: unknown` index signature to AppShell's EmployeeRow interface
- **Files modified:** src/components/AppShell.tsx
- **Verification:** Build passed after fix
- **Committed in:** 1ffc5f2 (Task 1 commit)

**2. [Rule 1 - Bug] Guarded record.id != null in delete handlers**
- **Found during:** Task 2 (EmployeeDetail modification)
- **Issue:** VacationRecordInput.id is `number | undefined`; calling `onDeleteVacation(record.id)` with potentially undefined value was a TypeScript error
- **Fix:** Added `record.id != null &&` guard before `onDeleteVacation?.(record.id)` in both RecordsTable and "all" year view
- **Files modified:** src/components/EmployeeDetail.tsx
- **Verification:** Build passed after fix
- **Committed in:** 5ed26f7 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes were necessary for TypeScript correctness. No scope creep.

## Issues Encountered

- Task 1 and Task 2 are tightly coupled for compilation — AppShell passes new props to EmployeesTab that didn't exist yet, so the build only passed after both files were updated. Committed separately after both compiled successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All CRUD operations are now fully wired: add/edit/delete employee, add/edit/delete vacation record
- Mutations call Server Actions which revalidatePath('/') server-side AND trigger router.refresh() client-side
- Phase 5 Plan 03 (if any) or release verification can proceed
- AppShell types are now tightened (no more `any[]` props per STATE.md note)

---
*Phase: 05-mutations-ui*
*Completed: 2026-03-25*

## Self-Check: PASSED

- FOUND: src/components/AppShell.tsx (modified)
- FOUND: src/components/EmployeesTab.tsx (modified)
- FOUND: src/components/EmployeeDetail.tsx (modified)
- FOUND: commit 1ffc5f2 (Task 1)
- FOUND: commit 5ed26f7 (Task 2)
