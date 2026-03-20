---
phase: 02-schema-services-and-actions
verified: 2026-03-19T00:00:00Z
status: gaps_found
score: 13/17 requirements verified
gaps:
  - truth: "Seed script file exists with all employees and vacation records"
    status: failed
    reason: "src/scripts/seed.ts does not exist anywhere in the project — the file was planned in 02-01 but never created"
    artifacts:
      - path: "src/scripts/seed.ts"
        issue: "File missing entirely"
    missing:
      - "Create src/scripts/seed.ts with idempotency guard, db.insert(employees).values([...]) with all seed employees copied from Electron db.js, and matching vacation_records inserts"

  - truth: "getVacationRecordsAction and getAllVacationRecordsAction Server Actions exist"
    status: failed
    reason: "src/lib/actions/vacationRecords.ts only exports 3 of the required 5 actions (add, update, delete). The two read actions — getVacationRecordsAction and getAllVacationRecordsAction — were never implemented. Plan 06 required all 5 but was executed as if only the 3 mutation actions were needed."
    artifacts:
      - path: "src/lib/actions/vacationRecords.ts"
        issue: "Missing getVacationRecordsAction and getAllVacationRecordsAction exports; getVacationRecords and getAllVacationRecords were not imported from the service layer"
    missing:
      - "Add import of getVacationRecords and getAllVacationRecords from '@/lib/services/vacationRecords'"
      - "Implement getVacationRecordsAction(employeeId: number): Promise<ActionResult<VacationRecord[]>> — no revalidatePath"
      - "Implement getAllVacationRecordsAction(): Promise<ActionResult<VacationRecord[]>> — no revalidatePath"

human_verification:
  - test: "Confirm Neon database has tables and seed data"
    expected: "SELECT COUNT(*) FROM employees returns 5+ rows; SELECT COUNT(*) FROM vacation_records returns 20+ rows; Бондаренко and Мельник have balance_reset records"
    why_human: "Plan 05 (drizzle-kit push + seed) has no SUMMARY.md confirming completion. The _journal.json entries array is empty (expected for drizzle-kit push, which does not write migration files). Cannot verify DB state programmatically without a live connection."
---

# Phase 2: Schema, Services, and Actions — Verification Report

**Phase Goal:** The PostgreSQL schema is live in Neon and all data access code exists — service functions, Drizzle queries, and Server Actions replacing every IPC channel
**Verified:** 2026-03-19
**Status:** gaps_found — 2 gaps blocking full goal achievement
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Drizzle schema defines employees and vacation_records tables with correct column types | VERIFIED | `src/lib/db/schema.ts` — pgEnum + two pgTable definitions, explicit snake_case column names, FK reference, all 4 inferred types exported |
| 2 | Drizzle db client is wired with schema import for type-safe queries | VERIFIED | `src/lib/db/index.ts` — `import * as schema from './schema'`; `drizzle({ client: sql, schema })`; `import 'server-only'` guard present |
| 3 | vacationLogic.ts is a pure TypeScript ES module with all business logic functions | VERIFIED | `src/lib/utils/vacationLogic.ts` — 245 lines, exports: RESET_DATE, DAYS_PER_MONTH, calculateEarnedDays, calculateUsedDays, calculateEmployeeBalance, calculatePeriodDays, calculateForecastDays, getVacationWorkingYear, formatDate; pure, no async, no DB access |
| 4 | All vacationLogic unit tests pass | VERIFIED | `src/lib/utils/vacationLogic.test.ts` — 206 lines, full test coverage of all exported functions including wasReset scenarios for both seed employees; jest.config.ts uses ts-jest preset, node environment, @/* alias |
| 5 | getEmployees(), addEmployee(), updateEmployee(), deleteEmployee() service functions exist | VERIFIED | `src/lib/services/employees.ts` — `import 'server-only'`; all 4 functions; manual cascade delete (vacationRecords first, then employee); real Drizzle queries with .returning() |
| 6 | getVacationRecords(), getAllVacationRecords(), addVacationRecord(), updateVacationRecord(), deleteVacationRecord() service functions exist | VERIFIED | `src/lib/services/vacationRecords.ts` — `import 'server-only'`; all 5 functions; correct ordering; .returning() on mutations |
| 7 | Employee Server Actions (getEmployeesAction, addEmployeeAction, updateEmployeeAction, deleteEmployeeAction) exist and revalidate on mutations | VERIFIED | `src/lib/actions/employees.ts` — `'use server'` first line; all 4 actions exported; ActionResult<T> discriminated union; revalidatePath('/') in add/update/delete; no revalidatePath in getEmployeesAction; no direct db imports |
| 8 | Vacation record Server Actions exist covering all 5 CRUD operations | FAILED | `src/lib/actions/vacationRecords.ts` only exports 3 actions (add, update, delete). getVacationRecordsAction and getAllVacationRecordsAction are missing. getVacationRecords and getAllVacationRecords were never imported from the service layer. |
| 9 | Seed script file exists with all employees and vacation records | FAILED | `src/scripts/seed.ts` does not exist. No `src/scripts/` directory exists at all. Plan 02-01 task 0 was supposed to create a seed stub, and task 2 the full implementation — neither was created. |
| 10 | Drizzle schema pushed to live Neon database | NEEDS HUMAN | `drizzle/meta/_journal.json` exists with `entries: []`. This is expected for `drizzle-kit push` (push does not write migration files; only `generate` does). Plan 02-05 has no SUMMARY.md. Cannot verify DB state without a live connection. |

**Score:** 7/10 truths verified (13/17 requirements satisfied)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/db/schema.ts` | pgTable definitions for employees and vacation_records | VERIFIED | Full schema: pgEnum, 2 tables, explicit SQL names, 4 inferred types exported |
| `src/lib/db/index.ts` | Neon + Drizzle client with schema wired in | VERIFIED | `import * as schema from './schema'`; `drizzle({ client: sql, schema })`; server-only |
| `src/lib/utils/vacationLogic.ts` | Pure TypeScript port of vacation business logic | VERIFIED | 245 lines, 9 exports including all required functions |
| `src/lib/utils/vacationLogic.test.ts` | Unit tests for all vacationLogic exported functions | VERIFIED | 206 lines, full tests including wasReset scenarios |
| `jest.config.ts` | Jest configuration for Next.js TypeScript project | VERIFIED | ts-jest preset, node environment, @/* path alias |
| `src/lib/services/employees.ts` | 4 employee service functions, server-only guarded | VERIFIED | All 4 functions, import 'server-only', real Drizzle queries |
| `src/lib/services/vacationRecords.ts` | 5 vacation record service functions, server-only guarded | VERIFIED | All 5 functions, import 'server-only', correct ordering |
| `src/lib/actions/employees.ts` | 4 employee Server Actions | VERIFIED | All 4 exported, 'use server', ActionResult<T>, revalidatePath on mutations |
| `src/lib/actions/vacationRecords.ts` | 5 vacation record Server Actions | STUB | Only 3 of 5 actions exported — missing getVacationRecordsAction and getAllVacationRecordsAction |
| `src/scripts/seed.ts` | Seed script with all employees and vacation records | MISSING | File does not exist; no src/scripts/ directory |
| `drizzle/meta/_journal.json` | Migration journal | PARTIAL | File exists with entries key but empty array — expected for push; no evidence push was ever run (no 02-05-SUMMARY.md) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/db/schema.ts` | `drizzle-orm/pg-core` | `import { pgTable, pgEnum, ... }` | WIRED | Line 1-11: all required pg-core symbols imported |
| `src/lib/db/index.ts` | `src/lib/db/schema.ts` | `import * as schema from './schema'` | WIRED | Line 4: exact pattern match |
| `src/lib/services/employees.ts` | `src/lib/db/index.ts` | `import { db } from '@/lib/db'` | WIRED | Line 2 |
| `src/lib/services/employees.ts` | `src/lib/db/schema.ts` | `import { employees } from '@/lib/db/schema'` | WIRED | Line 3 |
| `src/lib/services/vacationRecords.ts` | `src/lib/db/schema.ts` | `import { vacationRecords } from '@/lib/db/schema'` | WIRED | Line 3 |
| `src/lib/utils/vacationLogic.ts` | `date-fns` | `import { parseISO, isBefore } from 'date-fns'` | WIRED | Line 1 |
| `src/lib/actions/employees.ts` | `src/lib/services/employees.ts` | `import { getEmployees, ... } from '@/lib/services/employees'` | WIRED | Lines 4-9 |
| `src/lib/actions/employees.ts` | `next/cache` | `import { revalidatePath } from 'next/cache'` | WIRED | Line 3 |
| `src/lib/actions/vacationRecords.ts` | `src/lib/services/vacationRecords.ts` | `import { addVacationRecord, ... }` | PARTIAL | Only 3 of 5 service functions imported; getVacationRecords and getAllVacationRecords absent |
| `src/lib/actions/vacationRecords.ts` | `next/cache` | `import { revalidatePath } from 'next/cache'` | WIRED | Line 3 |
| `drizzle.config.ts` | `process.env.DATABASE_URL_UNPOOLED` | `dbCredentials.url` | WIRED | Line 9: `url: process.env.DATABASE_URL_UNPOOLED!` |
| `src/scripts/seed.ts` | `src/lib/db/index.ts` | `import { db } from '../lib/db'` | NOT_WIRED | seed.ts does not exist |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INFRA-05 | 02-05 | Schema pushed to live Neon database | NEEDS HUMAN | `drizzle/meta/_journal.json` exists; no 02-05-SUMMARY.md; cannot confirm DB state |
| DB-01 | 02-01 | `employees` table defined in Drizzle schema | SATISFIED | `src/lib/db/schema.ts` lines 19-27: full pgTable definition |
| DB-02 | 02-01 | `vacation_records` table defined in Drizzle schema | SATISFIED | `src/lib/db/schema.ts` lines 29-41: full pgTable with FK and pgEnum |
| DB-03 | 02-01 | Seed data inserted (all employees, archive records, 2026 vacations) | BLOCKED | `src/scripts/seed.ts` does not exist |
| DB-04 | 02-04 | Drizzle schema exports wired into db client | SATISFIED | `src/lib/db/index.ts`: `import * as schema`; `drizzle({ client: sql, schema })` |
| DB-05 | 02-04 | drizzle-kit migrations journal reflects applied schema | SATISFIED (partial) | `drizzle/meta/_journal.json` exists; push behavior does not populate entries — this is correct |
| SVC-01 | 02-02 | `getEmployees()` service function | SATISFIED | `src/lib/services/employees.ts` lines 6-12 |
| SVC-02 | 02-02 | `getVacationRecords(employeeId)` service function | SATISFIED | `src/lib/services/vacationRecords.ts` lines 7-13 |
| SVC-03 | 02-02 | `getAllVacationRecords()` service function | SATISFIED | `src/lib/services/vacationRecords.ts` lines 15-20 |
| SVC-04 | 02-01/02-02 | `vacationLogic.ts` TypeScript port | SATISFIED | `src/lib/utils/vacationLogic.ts` — all functions exported, 24+ passing tests |
| ACT-01 | 02-03 | `getEmployeesAction` Server Action | SATISFIED | `src/lib/actions/employees.ts` lines 16-23 |
| ACT-02 | 02-03 | `addEmployeeAction` Server Action | SATISFIED | `src/lib/actions/employees.ts` lines 25-35: revalidatePath present |
| ACT-03 | 02-03 | `updateEmployeeAction` Server Action | SATISFIED | `src/lib/actions/employees.ts` lines 37-47: revalidatePath present |
| ACT-04 | 02-03 | `deleteEmployeeAction` Server Action | SATISFIED | `src/lib/actions/employees.ts` lines 49-57: revalidatePath present |
| ACT-05 | 02-06 | `addVacationRecordAction` Server Action | SATISFIED | `src/lib/actions/vacationRecords.ts` lines 15-25: revalidatePath present |
| ACT-06 | 02-06 | `updateVacationRecordAction` Server Action | SATISFIED | `src/lib/actions/vacationRecords.ts` lines 27-37: revalidatePath present |
| ACT-07 | 02-06 | `deleteVacationRecordAction` Server Action | SATISFIED | `src/lib/actions/vacationRecords.ts` lines 39-47: revalidatePath present |

**Note on ACT-05/06/07 vs missing read actions:** The requirement IDs ACT-05, ACT-06, ACT-07 as defined in RESEARCH.md map to add, update, and delete vacation record actions — all three are present. However, plan 02-06's `must_haves` artifact spec required 5 exports including `getVacationRecordsAction` and `getAllVacationRecordsAction`. Those two read actions have no requirement ID assigned in the REQUIREMENTS table but are still missing from the codebase and will be needed by Phase 3 UI.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/actions/vacationRecords.ts` | 4-8 | Only 3 of 5 service functions imported; read functions absent | Blocker | Phase 3 Client Components cannot fetch vacation records via Server Actions |
| `src/scripts/seed.ts` | — | File entirely absent | Blocker | Neon database may be empty; no way to populate it without the seed script |

---

## Human Verification Required

### 1. Neon Database State

**Test:** Open Neon console (console.neon.tech), navigate to the vacation-dashboard-web database, run:
- `SELECT COUNT(*) FROM employees;` — expect 5+ rows
- `SELECT COUNT(*) FROM vacation_records;` — expect 20+ rows
- `SELECT full_name, hire_date FROM employees ORDER BY full_name;` — verify Cyrillic names and hire dates
- Confirm Бондаренко Олексій and Мельник Дмитро each have a `balance_reset` record in vacation_records

**Expected:** Tables exist with employee and record data matching the Electron app source

**Why human:** Plan 02-05 (drizzle-kit push + seed run) has no SUMMARY.md confirming it was executed. The `_journal.json` entries are empty, which is normal for drizzle-kit push but provides no confirmation. The seed script itself is missing (gap above), so even if tables exist, data may not have been inserted.

---

## Gaps Summary

Two gaps prevent full goal achievement:

**Gap 1 — Seed script missing (DB-03).** `src/scripts/seed.ts` was planned in plan 02-01 (wave 0 stub) and plan 02-01 task 2 (full implementation) but was never created. The `src/scripts/` directory does not exist. Without this file, the Neon database cannot be populated with employee data, and plan 02-05's seed step could not have run.

**Gap 2 — Two vacation record read actions missing (plan 02-06 must_haves).** `src/lib/actions/vacationRecords.ts` was implemented with only 3 mutation actions (add, update, delete) rather than the 5 specified in plan 02-06. `getVacationRecordsAction(employeeId)` and `getAllVacationRecordsAction()` are absent. The service functions `getVacationRecords` and `getAllVacationRecords` exist and are correct — they were simply never wrapped in the actions file. The plan 02-04 SUMMARY claimed ACT-01 through ACT-07 complete but those read action IDs were not in scope for the requirement IDs; the missing actions are a plan 02-06 spec gap regardless.

These two gaps must be addressed before Phase 3 UI components can fetch and display data.

---

_Verified: 2026-03-19_
_Verifier: Claude (gsd-verifier)_
