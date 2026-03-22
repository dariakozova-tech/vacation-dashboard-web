---
phase: 03-data-migration
plan: 01
subsystem: database
tags: [sqlite, postgresql, neon, migration, better-sqlite3, tsx]

# Dependency graph
requires:
  - phase: 02-schema-services-and-actions
    provides: Neon schema with employees and vacation_records tables using generatedAlwaysAsIdentity
provides:
  - One-time SQLite-to-Neon migration script preserving original IDs
  - Neon populated with 42 employees and 249 vacation_records from live Electron app
  - Post-migration integration test suite (5 tests) verifying data integrity
affects: [04-ui-components, 05-analytics]

# Tech tracking
tech-stack:
  added: [better-sqlite3, @types/better-sqlite3, tsx]
  patterns: [OVERRIDING SYSTEM VALUE for identity columns, setval() for sequence reset, neon() direct (unpooled) for migration DDL]

key-files:
  created:
    - src/scripts/migrate-from-sqlite.ts
    - __tests__/migration.test.ts
  modified:
    - package.json

key-decisions:
  - "Use SELECT setval() instead of ALTER SEQUENCE RESTART WITH for resetting sequences — ALTER SEQUENCE does not accept parameterized values in neon tagged template literals"
  - "Use npm rebuild better-sqlite3 from project root (not node-gyp directly in module dir) to place .node file in the expected Release/ path"
  - "tsx (not ts-node) used to run migration script — tsconfig uses moduleResolution: bundler incompatible with ts-node"

patterns-established:
  - "Migration pattern: TRUNCATE -> OVERRIDING SYSTEM VALUE INSERT -> setval() -> inline assertions"
  - "Sequence reset via setval(seq, val, false) sets next_value to val without consuming it"

requirements-completed: [MIG-01, MIG-02, MIG-03, MIG-04, MIG-05]

# Metrics
duration: 7min
completed: 2026-03-22
---

# Phase 3 Plan 01: Data Migration Summary

**SQLite-to-Neon migration of 42 employees and 249 vacation_records with original IDs preserved via OVERRIDING SYSTEM VALUE, sequences reset to max+1, verified by 5 passing integration tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-22T22:32:16Z
- **Completed:** 2026-03-22T22:39:45Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Installed and compiled better-sqlite3 for system Node.js (arm64, ABI 141) using npm rebuild
- Migrated all production data from Electron SQLite DB to Neon: 42 employees (max ID 48, gaps preserved) and 249 vacation_records (max ID 278)
- Sequences reset: employees_id_seq=49, vacation_records_id_seq=279 — new inserts auto-assign IDs above migrated data
- Created post-migration integration test suite with 5 tests, all passing against live Neon

## Task Commits

Each task was committed atomically:

1. **Task 1: Install better-sqlite3 and write migration script** - `c81e7b4` (feat)
2. **Task 2: Run migration and verify data integrity** - `780d390` (feat)
3. **Task 3: Create post-migration integration tests** - `cc75aec` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/scripts/migrate-from-sqlite.ts` - One-time SQLite-to-Neon migration script with inline verification
- `__tests__/migration.test.ts` - Post-migration integration tests (5 tests) querying live Neon
- `package.json` - Added better-sqlite3, @types/better-sqlite3, tsx as devDependencies

## Decisions Made

- Used `SELECT setval('seq', val, false)` instead of `ALTER SEQUENCE ... RESTART WITH ${val}` because neon's tagged template literal parameterizes values, which is invalid SQL syntax for ALTER SEQUENCE
- Used `npm rebuild better-sqlite3` from project root rather than running node-gyp directly in the module directory — the former places the compiled binary at `build/Release/better_sqlite3.node` where `bindings` looks for it
- Used `tsx` to run the TypeScript migration script instead of `ts-node` because tsconfig uses `moduleResolution: "bundler"` which is incompatible with ts-node

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ALTER SEQUENCE RESTART WITH does not accept parameterized values**
- **Found during:** Task 2 (Run migration and verify data integrity)
- **Issue:** `await sql\`ALTER SEQUENCE employees_id_seq RESTART WITH ${maxEmpId + 1}\`` failed with PostgreSQL error "syntax error at or near '$1'" — neon tagged templates always parameterize interpolated values, but ALTER SEQUENCE does not support parameterized arguments
- **Fix:** Replaced with `SELECT setval('employees_id_seq', ${maxEmpId + 1}, false)` which accepts parameters and achieves the same result (sets next value without consuming it)
- **Files modified:** src/scripts/migrate-from-sqlite.ts
- **Verification:** Migration completed successfully; sequences verified at expected values (49 and 279)
- **Committed in:** 780d390 (Task 2 commit)

**2. [Rule 3 - Blocking] better-sqlite3 native module not in expected path after node-gyp rebuild**
- **Found during:** Task 2 (first migration run attempt)
- **Issue:** Running node-gyp from inside the module directory output the binary to a location not found by the `bindings` package; tsx could not load the module
- **Fix:** Ran `npm rebuild better-sqlite3` from project root — this correctly places the binary at `node_modules/better-sqlite3/build/Release/better_sqlite3.node`
- **Files modified:** none (build artifact, not committed)
- **Verification:** `node -e "require('./node_modules/better-sqlite3')"` succeeded; migration ran
- **Committed in:** 780d390 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes essential for migration to run. No scope creep.

## Issues Encountered

- Jest 30 renamed `--testPathPattern` to `--testPathPatterns` (plural) — used the new flag to run tests

## User Setup Required

None - no external service configuration required beyond existing .env.local.

## Next Phase Readiness

- Neon database is fully populated with production data matching Electron app state as of 2026-03-22
- All employee IDs and vacation_record IDs preserved — no FK remapping needed in Phase 4 UI
- Sequences correctly set — Phase 4 can add new employees/records without ID collisions
- Integration test suite serves as regression guard for any future schema changes
