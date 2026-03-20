---
phase: 02-schema-services-and-actions
plan: "01"
subsystem: database
tags: [drizzle-orm, postgresql, neon, jest, ts-jest, seed, schema]

# Dependency graph
requires:
  - phase: 01-infrastructure
    provides: Neon database connection, drizzle client stub, schema.ts stub

provides:
  - Drizzle pgTable schema for employees and vacation_records with explicit SQL column names
  - Jest test infrastructure with ts-jest preset and @/* path alias
  - vacationLogic.test.ts with 24 passing unit tests (full tests, not just scaffold)
  - src/scripts/seed.ts with full idempotent seed script for all employees and vacation records

affects:
  - 02-02-services
  - 02-03-actions
  - 02-04-db-client

# Tech tracking
tech-stack:
  added: []  # All packages (jest, @types/jest, ts-jest, jest-environment-node, date-fns) were already installed in prior runs
  patterns:
    - "Drizzle pgTable with explicit SQL column names (Option A) to match Electron snake_case schema"
    - "pgEnum for record_type discriminated union (period | days_sum | balance_reset)"
    - "date({ mode: 'string' }) for date-only columns — returns YYYY-MM-DD string, no timezone conversion"
    - "Idempotent seed script: check employee count before inserting"

key-files:
  created:
    - src/scripts/seed.ts
  modified:
    - src/lib/db/schema.ts  # was stub, now fully defined (done in prior execution)
    - jest.config.ts        # created in prior execution
    - src/lib/utils/vacationLogic.test.ts  # created in prior execution

key-decisions:
  - "Use explicit SQL column name strings in pgTable (Option A) rather than casing: 'snake_case' on db client — more explicit and visible at schema definition site"
  - "date({ mode: 'string' }) for hire_date, start_date, end_date — preserves YYYY-MM-DD string format matching vacationLogic.ts expectations"
  - "Seed script is idempotent via employee count check before insert — mirrors Electron db.js pattern"
  - "Archive period deduplication done in-memory during seed (not via DB query) — simpler for a one-shot seed script"
  - "2026 vacation periods and Deel 2026 vacations merged into a single VACATION_2026 array in seed"

patterns-established:
  - "Schema: pgTable definitions in src/lib/db/schema.ts with $inferSelect / $inferInsert exported types"
  - "Seed: run via npx tsx src/scripts/seed.ts (not at app startup)"
  - "Tests: Jest with ts-jest preset, testEnvironment node, moduleNameMapper @/* -> <rootDir>/src/*"

requirements-completed: [DB-01, DB-02, DB-03, SVC-04]

# Metrics
duration: 15min
completed: 2026-03-20
---

# Phase 2 Plan 01: Schema, Jest, and Seed Summary

**Drizzle pgTable schema for employees/vacation_records with explicit snake_case SQL names, 24-test Jest suite for vacationLogic, and full idempotent PostgreSQL seed script mirroring all Electron db.js data**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-20T00:00:00Z
- **Completed:** 2026-03-20T00:15:00Z
- **Tasks:** 3 (Task 0, Task 1, Task 2)
- **Files modified:** 1 new file created (seed.ts); schema.ts, jest.config.ts, and vacationLogic.test.ts were already complete from prior runs

## Accomplishments
- Full Drizzle schema defined with employees and vacation_records tables using explicit SQL column names
- Jest test infrastructure installed with ts-jest preset and 24 vacationLogic unit tests passing
- Full idempotent seed script with 37 TOV employees, 6 Deel contractors, archive periods (2024-2025), 2026 vacation periods, and email addresses

## Task Commits

1. **Task 0: Install Jest + create seed stub** - `4941de2` (chore) — seed stub file created; jest/schema/tests were pre-existing from prior plan execution
2. **Task 1: Define Drizzle schema** — already committed in prior runs (schema.ts was complete)
3. **Task 2: Implement full seed script** - `42ccd7b` (feat)

## Files Created/Modified
- `/Users/dariakozova/Documents/vacation-dashboard-web/src/scripts/seed.ts` - Full idempotent seed script; inserts 37 TOV + 6 Deel employees, days_sum archives, balance_reset records, 100+ archive periods, 2026 vacation periods
- `src/lib/db/schema.ts` - pgTable definitions for employees and vacation_records (committed in prior run)
- `jest.config.ts` - ts-jest preset, node environment, @/* alias (committed in prior run)
- `src/lib/utils/vacationLogic.test.ts` - 24 unit tests for all exported vacationLogic functions (committed in prior run)

## Decisions Made
- Used explicit SQL column name strings in pgTable (Option A from research) rather than `casing: 'snake_case'` on db client — explicit and visible at the schema definition site
- `date({ mode: 'string' })` for all date-only columns preserves YYYY-MM-DD string format, matching what vacationLogic.ts expects from date-fns parseISO
- Seed idempotency via employee count check before any inserts, mirroring Electron db.js `seedRealData()` pattern
- Deduplication of archive periods done in-memory (Set of `employeeId|start|end` keys) rather than per-row DB query — simpler for a one-time seed script
- 2026 vacations for TOV and Deel merged into one VACATION_2026 array in seed script

## Deviations from Plan

None — plan executed as written. The vacationLogic.test.ts was already a full 24-test suite (not a scaffold) from a prior execution; the seed.ts was the missing piece that was created in this run.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required. The seed script requires `DATABASE_URL` in `.env.local` to run against the live Neon database, but this was already configured in Phase 1.

## Next Phase Readiness
- Schema is committed and TypeScript-clean — ready for drizzle-kit push (plan 05)
- Seed script is ready to run against Neon once drizzle-kit push has created the tables
- Jest infrastructure is ready for vacationLogic unit tests — all 24 tests green
- Plans 02-02 (services), 02-03 (actions), 02-04 (db client wire) are already completed in prior runs

---
*Phase: 02-schema-services-and-actions*
*Completed: 2026-03-20*
