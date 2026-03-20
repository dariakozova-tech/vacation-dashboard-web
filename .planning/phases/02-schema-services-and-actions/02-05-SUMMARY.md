---
phase: 02-schema-services-and-actions
plan: "05"
subsystem: database
tags: [neon, drizzle, postgres, seed, drizzle-kit]

# Dependency graph
requires:
  - phase: 02-schema-services-and-actions
    provides: Drizzle schema definitions (employees + vacation_records + record_type enum)
provides:
  - Live Neon database with employees and vacation_records tables
  - 42 employees (36 TOV + 6 Deel) with emails and hire dates
  - 249 vacation records (periods, days_sum summaries, balance_resets)
  - Idempotent seed script safe to re-run
affects: [03-api-routes, 04-ui]

# Tech tracking
tech-stack:
  added: [drizzle-kit push, tsx, dotenv]
  patterns: [seed script uses direct neon()+drizzle() connection to bypass server-only guards]

key-files:
  created: []
  modified:
    - drizzle/meta/_journal.json
    - src/scripts/seed.ts

key-decisions:
  - "seed.ts uses neon()+drizzle() directly instead of importing from src/lib/db/index.ts to avoid server-only guard at runtime in Node/tsx"
  - "dotenv config({ path: '.env.local' }) placed at top of seed.ts before any imports that consume env vars"

patterns-established:
  - "Seed scripts: use direct DB client construction, not application db module, to avoid Next.js server-only boundary"

requirements-completed: [INFRA-05]

# Metrics
duration: ~15min
completed: 2026-03-20
---

# Phase 02 Plan 05: Push Schema and Seed Database Summary

**Drizzle schema pushed to Neon and seeded with 42 employees + 249 vacation records via idempotent tsx seed script**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-20
- **Completed:** 2026-03-20
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- employees and vacation_records tables created in Neon via `drizzle-kit push`, including the record_type enum
- 42 employees (36 ТОВ Текері + 6 Deel contractors) inserted with Cyrillic names, hire dates, and emails
- 249 vacation records inserted: archive periods (2024-2026), yearly days_sum summaries, and balance_reset markers for employees who went negative at 01.01.2026
- Human verification confirmed correct row counts and data fidelity in Neon console

## Task Commits

Each task was committed atomically:

1. **Task 1: Push schema to Neon with drizzle-kit** - `99ec3b9` (chore)
2. **Task 2: Run seed script** - `6dd2bb6` (feat — includes deviation fix)
3. **Task 3: Human verify — confirm data in Neon console** - (checkpoint approved, no code commit)

## Files Created/Modified

- `drizzle/meta/_journal.json` - Updated with applied schema migration journal entry
- `src/scripts/seed.ts` - Patched: direct neon()+drizzle() client, dotenv load at top of file

## Decisions Made

- Used direct `neon()` + `drizzle()` construction in seed.ts instead of the app's `src/lib/db/index.ts` module. The application db module uses `server-only`, which throws at import time in a plain Node/tsx context. Bypassing it in the seed script is correct — seeding is a build-time operation, not a request handler.
- Loaded dotenv with `config({ path: '.env.local' })` as the very first line of seed.ts (before schema imports) so DATABASE_URL is available when the Neon client initializes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] seed.ts imported server-only db module, crashing in tsx**
- **Found during:** Task 2 (Run seed script)
- **Issue:** Original seed.ts imported `db` from `src/lib/db/index.ts`, which contains a `server-only` guard. Running `npx tsx src/scripts/seed.ts` threw "This module cannot be imported from a Client Component or Script" and exited immediately.
- **Fix:** Replaced the import with an inline `neon(process.env.DATABASE_URL!)` + `drizzle({ client: sql, schema })` construction at the top of the file.
- **Files modified:** `src/scripts/seed.ts`
- **Verification:** `npx tsx src/scripts/seed.ts` exited 0 and logged "Seeded 42 employees, 249 vacation records"
- **Committed in:** `6dd2bb6` (Task 2 commit)

**2. [Rule 3 - Blocking] dotenv not loaded before schema imports consumed DATABASE_URL**
- **Found during:** Task 2 (Run seed script) — same run as fix above
- **Issue:** dotenv `config()` call was positioned after schema imports; DATABASE_URL was undefined when the Neon client initialized.
- **Fix:** Moved `import { config } from 'dotenv'; config({ path: '.env.local' });` to the top of the file, before all other imports.
- **Files modified:** `src/scripts/seed.ts`
- **Verification:** DATABASE_URL resolved correctly; Neon connection succeeded.
- **Committed in:** `6dd2bb6` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — blocking)
**Impact on plan:** Both fixes were essential to run the seed script at all. No scope creep.

## Issues Encountered

None beyond the two blocking issues documented above.

## User Setup Required

None - no additional external service configuration required beyond what was already set up.

## Next Phase Readiness

- Neon database is fully populated and ready for service function queries
- employees and vacation_records tables match the Drizzle schema exactly
- All 42 employees with correct hire_date, is_deel, email values present
- balance_reset records exist for all employees who went negative at 01.01.2026
- Phase 3 (API routes) can query the database immediately

---
*Phase: 02-schema-services-and-actions*
*Completed: 2026-03-20*
