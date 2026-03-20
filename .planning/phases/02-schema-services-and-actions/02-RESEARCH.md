# Phase 2: Schema, Services, and Actions - Research

**Researched:** 2026-03-12
**Domain:** Drizzle ORM 0.45 + Neon PostgreSQL + Next.js 16 Server Actions
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-05 | Schema pushed to live Neon database (drizzle-kit push) | drizzle-kit push against DATABASE_URL_UNPOOLED confirmed working; drizzle.config.ts already wired |
| DB-01 | `employees` table defined in Drizzle schema (mirrors Electron SQLite schema) | pgTable + pgEnum patterns documented; column type mapping from SQLite -> PostgreSQL established |
| DB-02 | `vacation_records` table defined in Drizzle schema | Same as DB-01; record_type enum required; nullable columns mapped |
| DB-03 | Seed data inserted (all ТОВ + Deel employees, archive records, 2026 vacations) | Drizzle insert().values() with returning() covers this; seed script pattern documented |
| DB-04 | Drizzle schema exports wired into db client (so queries are type-safe) | import * as schema; drizzle({ client: sql, schema }) pattern confirmed |
| DB-05 | drizzle-kit migrations journal reflects applied schema | push command writes _journal.json; drizzle.config.ts already uses DATABASE_URL_UNPOOLED |
| SVC-01 | getEmployees() service function | db.select().from(employees).where(eq(employees.isActive, true)).orderBy(asc(employees.fullName)) |
| SVC-02 | getVacationRecords(employeeId) service function | db.select().from(vacationRecords).where(eq(vacationRecords.employeeId, employeeId)) |
| SVC-03 | getAllVacationRecords() service function | db.select().from(vacationRecords).orderBy(...) |
| SVC-04 | vacationLogic.ts port (calculateEmployeeBalance, etc.) to TypeScript ES module | Pure function port; date-fns already a transitive dep; needs explicit install |
| ACT-01 | getEmployeesAction Server Action | 'use server' file; calls SVC-01; returns typed array |
| ACT-02 | addEmployeeAction Server Action | Calls db insert + revalidatePath('/') |
| ACT-03 | updateEmployeeAction Server Action | Calls db update + revalidatePath('/') |
| ACT-04 | deleteEmployeeAction Server Action | Cascades vacation_records delete, then employee delete + revalidatePath('/') |
| ACT-05 | addVacationRecordAction Server Action | Calls db insert + revalidatePath('/') |
| ACT-06 | updateVacationRecordAction Server Action | Calls db update + revalidatePath('/') |
| ACT-07 | deleteVacationRecordAction Server Action | Calls db delete + revalidatePath('/') |
</phase_requirements>

---

## Summary

Phase 2 replaces the Electron IPC/SQLite layer with a Neon PostgreSQL schema defined via Drizzle ORM, pure service functions that query it, and Next.js Server Actions that expose those services to the React tree. The Electron app's `db.js` and `vacationLogic.js` serve as the authoritative business-logic and data-shape reference.

The schema mirrors the existing SQLite schema almost exactly. The main differences are: `INTEGER PRIMARY KEY AUTOINCREMENT` becomes `integer().primaryKey().generatedAlwaysAsIdentity()`, bare `TEXT` date columns become `date({ mode: 'string' })` for correctness, and `record_type` becomes a `pgEnum`. The `is_deel` flag (integer 0/1 in SQLite) becomes `boolean().default(false)`. The `email` column added via migration in the Electron app is included in the initial schema here.

Server Actions are thin wrappers: they call a service function, call `revalidatePath('/')` after mutations, and return a discriminated union `{ success: true; data: T } | { success: false; error: string }`. The business logic (`vacationLogic.js`) is ported verbatim as a TypeScript ES module with no architectural change.

**Primary recommendation:** Define schema in `src/lib/db/schema.ts`, push with `drizzle-kit push`, put service functions in `src/lib/services/`, put Server Actions in `src/lib/actions/`, and port `vacationLogic.js` to `src/lib/utils/vacationLogic.ts`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.1 (installed) | Type-safe ORM query builder for PostgreSQL | Already installed; official Neon-recommended ORM |
| drizzle-kit | 0.31.9 (installed) | Schema push / migration tooling | Already installed; `drizzle-kit push` applies schema to Neon |
| @neondatabase/serverless | 1.0.2 (installed) | Neon HTTP driver | Already installed; required for serverless/edge environments |
| next | 16.1.6 (installed) | Server Actions framework | Already installed; 'use server' directive is stable |
| date-fns | not installed | Date arithmetic for vacationLogic port | Used in Electron app; pure functions, zero side effects; must be added |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| server-only | 0.0.1 (installed) | Prevents db client from being imported in client bundles | Already used in src/lib/db/index.ts |
| zod | not installed (optional) | Input validation for Server Actions | Add if action input validation becomes complex; not required for Phase 2 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| date-fns | dayjs, native Date | vacationLogic.js already uses date-fns; porting would require rewriting all helpers |
| pgEnum for record_type | text with CHECK constraint | pgEnum is type-safe in Drizzle and generates proper PostgreSQL ENUM type |
| drizzle-kit push | drizzle-kit generate + migrate | push is simpler for solo/small-team projects; generate/migrate gives SQL audit trail — either works for this app |

**Installation:**

```bash
npm install date-fns
```

No other new packages are required — all other dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── db/
│   │   ├── index.ts          # Neon + Drizzle client (exists; add schema import)
│   │   └── schema.ts         # pgTable definitions (currently stub — populate here)
│   ├── services/
│   │   ├── employees.ts      # getEmployees(), addEmployee(), updateEmployee(), deleteEmployee()
│   │   └── vacationRecords.ts # getVacationRecords(), getAllVacationRecords(), addVacationRecord(), ...
│   ├── actions/
│   │   ├── employees.ts      # Server Actions wrapping employee services
│   │   └── vacationRecords.ts # Server Actions wrapping vacation record services
│   └── utils/
│       └── vacationLogic.ts  # Port of Electron vacationLogic.js
├── app/
│   └── ...                   # Next.js App Router pages (Phase 3+)
└── scripts/
    └── seed.ts               # One-time seed script (run via tsx, not at app startup)
```

### Pattern 1: Schema Definition

**What:** Define tables as TypeScript constants using `pgTable`, `pgEnum`, and column builders from `drizzle-orm/pg-core`. Export all tables so drizzle-kit can detect them.

**When to use:** This is the only pattern — schema lives entirely in `schema.ts`.

```typescript
// Source: https://orm.drizzle.team/docs/sql-schema-declaration
// src/lib/db/schema.ts
import {
  pgTable, pgEnum, integer, text, varchar,
  boolean, date, timestamp, real
} from 'drizzle-orm/pg-core';

export const recordTypeEnum = pgEnum('record_type', [
  'period',
  'days_sum',
  'balance_reset',
]);

export const employees = pgTable('employees', {
  id:        integer().primaryKey().generatedAlwaysAsIdentity(),
  fullName:  varchar({ length: 255 }).notNull(),
  hireDate:  date({ mode: 'string' }).notNull(),
  isActive:  boolean().default(true).notNull(),
  isDeel:    boolean().default(false).notNull(),
  email:     varchar({ length: 255 }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const vacationRecords = pgTable('vacation_records', {
  id:         integer().primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer().notNull().references(() => employees.id),
  recordType: recordTypeEnum().notNull(),
  startDate:  date({ mode: 'string' }),
  endDate:    date({ mode: 'string' }),
  daysCount:  real(),
  year:       integer(),
  note:       text(),
  createdAt:  timestamp({ withTimezone: true }).defaultNow().notNull(),
});
```

**Critical note on column naming:** Drizzle uses camelCase in TypeScript but maps to snake_case in the database. The `drizzle({ client: sql })` instance in `src/lib/db/index.ts` does NOT pass a `casing` option, which means Drizzle defaults to using the exact TypeScript key name as the column name. This will create columns named `fullName`, `hireDate`, etc. — NOT `full_name`, `hire_date`.

**Two valid approaches:**

Option A (recommended for this project): Add explicit column name strings to match the Electron schema:
```typescript
fullName: varchar('full_name', { length: 255 }).notNull(),
hireDate: date('hire_date', { mode: 'string' }).notNull(),
```

Option B: Add `casing: 'snake_case'` to the drizzle() call in `src/lib/db/index.ts`:
```typescript
export const db = drizzle({ client: sql, schema, casing: 'snake_case' });
```

**Option A is safer** because it works regardless of drizzle-kit config and is explicit. The planner should pick one and be consistent.

### Pattern 2: Wire Schema into DB Client

**What:** Import all schema exports into the Drizzle client so queries are type-safe.

```typescript
// Source: https://orm.drizzle.team/docs/connect-neon
// src/lib/db/index.ts (updated)
import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
```

### Pattern 3: Service Functions

**What:** Plain async functions (NOT Server Actions) that call `db` directly. Importable from both Server Actions and Server Components.

```typescript
// src/lib/services/employees.ts
import 'server-only';
import { db } from '@/lib/db';
import { employees } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getEmployees() {
  return db
    .select()
    .from(employees)
    .where(eq(employees.isActive, true))
    .orderBy(asc(employees.fullName));
}

export async function addEmployee(data: {
  fullName: string;
  hireDate: string;
  isDeel?: boolean;
}) {
  const [row] = await db.insert(employees).values(data).returning();
  return row;
}
```

### Pattern 4: Server Actions

**What:** `'use server'` file with exported async functions. Each mutation calls a service function then calls `revalidatePath('/')` to bust the Next.js cache. Returns a discriminated union so client components can handle errors without throwing.

```typescript
// Source: https://nextjs.org/docs/app/api-reference/directives/use-server
// src/lib/actions/employees.ts
'use server';
import { revalidatePath } from 'next/cache';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee }
  from '@/lib/services/employees';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getEmployeesAction(): Promise<ActionResult<Awaited<ReturnType<typeof getEmployees>>>> {
  try {
    const data = await getEmployees();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function addEmployeeAction(
  input: Parameters<typeof addEmployee>[0]
): Promise<ActionResult<Awaited<ReturnType<typeof addEmployee>>>> {
  try {
    const data = await addEmployee(input);
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
```

### Pattern 5: drizzle-kit push to apply schema

**What:** Run once after writing schema.ts to create tables in Neon.

```bash
# Source: https://orm.drizzle.team/docs/drizzle-kit-push
npx drizzle-kit push
```

The `drizzle.config.ts` already uses `DATABASE_URL_UNPOOLED` which is the correct connection string for drizzle-kit (pooled connections are not supported for DDL operations).

### Pattern 6: Seed Script (run once, not at app startup)

**What:** A standalone `tsx` script that inserts all employees and vacation records. The seed data lives in the Electron app's `db.js` — copy it verbatim into the seed script.

```typescript
// src/scripts/seed.ts
import 'dotenv/config';
import { db } from '../lib/db';
// ... insert employees and records
```

Run with:
```bash
npx tsx src/scripts/seed.ts
```

**Important:** The seed data contains Cyrillic names, `is_deel` flags, archive periods, 2026 vacation periods, and email addresses. The seed script should be idempotent — skip if data already exists — to match the Electron behavior.

### Anti-Patterns to Avoid

- **Calling `db` in a Client Component:** `db` has `server-only` guard; will throw. All DB access goes through services or Server Actions.
- **Defining 'use server' inline in Server Components for data reading:** Only needed for mutation functions. Data reads go through services called directly in async Server Components.
- **Throwing from Server Actions:** Client components cannot catch thrown exceptions from Server Actions in the same way. Return `{ success: false, error }` instead.
- **Using drizzle without the schema import in db client:** Without `import * as schema`, relational queries and type inference are degraded. Always pass `schema` to `drizzle()`.
- **Using pooled `DATABASE_URL` for drizzle-kit push:** drizzle-kit requires a direct (unpooled) connection. `DATABASE_URL_UNPOOLED` is already in `.env.local` and `drizzle.config.ts` already references it correctly.
- **Storing dates as `timestamp` when the original was a date string:** The Electron schema stores `hire_date`, `start_date`, `end_date` as `TEXT` date strings (`YYYY-MM-DD`). Use `date({ mode: 'string' })` in Drizzle to preserve this exact behavior — no timezone conversion, values come back as `'YYYY-MM-DD'` strings, matching what `vacationLogic.ts` expects.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PostgreSQL date column | Custom string serialize/deserialize | `date({ mode: 'string' })` from drizzle-orm/pg-core | Handles PostgreSQL DATE type correctly; returns 'YYYY-MM-DD' string |
| Filtering rows | Raw SQL strings | `eq`, `and`, `or`, `asc`, `desc` from drizzle-orm | Parameterized automatically; type-safe |
| Insert returning new row | Second SELECT after insert | `.returning()` on insert/update/delete | Atomic; returns the inserted row in one round-trip |
| Schema-to-TypeScript types | Manual type definitions | Drizzle's `$inferSelect` / `$inferInsert` on table objects | Always in sync with schema |
| Cache invalidation after mutation | Manual router.refresh() calls in client | `revalidatePath('/')` in Server Action | Correct Next.js cache invalidation; works with ISR |

**Key insight:** The business-logic layer (`vacationLogic.ts`) is pure functions with no database access — do not change this architecture. Keep it fully separate from services.

---

## Common Pitfalls

### Pitfall 1: Column Name Mismatch (camelCase vs snake_case)
**What goes wrong:** Drizzle TypeScript keys like `fullName` become PostgreSQL columns named `"fullName"` (case-sensitive) unless you pass explicit column names or the `casing: 'snake_case'` option. The seed data and vacationLogic use snake_case keys (`full_name`, `hire_date`). If column names don't match, queries will fail at runtime.
**Why it happens:** Drizzle defaults to using the TypeScript key name verbatim as the column name.
**How to avoid:** Either pass explicit SQL column names in pgTable (`varchar('full_name', ...)`) or add `casing: 'snake_case'` to the `drizzle()` call. Pick one approach and use it everywhere.
**Warning signs:** `column "fullName" does not exist` errors from PostgreSQL.

### Pitfall 2: date() vs timestamp() for Date-Only Columns
**What goes wrong:** Using `timestamp()` for `hire_date`, `start_date`, `end_date` makes Drizzle return JS `Date` objects with timezone offsets, which will break `vacationLogic.ts` date arithmetic (it uses `parseISO` from date-fns expecting `'YYYY-MM-DD'` strings).
**Why it happens:** It seems natural to reach for `timestamp`, but these columns contain dates only.
**How to avoid:** Use `date({ mode: 'string' })` for all date-only columns. This stores a PostgreSQL `DATE` and returns a `'YYYY-MM-DD'` string — exactly what the Electron app's TEXT columns contained.
**Warning signs:** Balance calculations off by ±1 day; timezone-related test failures.

### Pitfall 3: Seed Script Not Idempotent
**What goes wrong:** Running the seed script twice inserts duplicate employees and records, corrupting balances.
**Why it happens:** A simple `INSERT INTO ... VALUES ...` without existence checks.
**How to avoid:** Check `SELECT COUNT(*) FROM employees` before seeding (the Electron db.js uses this exact pattern). For archive periods, deduplicate on `(employeeId, startDate, endDate)`.

### Pitfall 4: Missing revalidatePath After Mutations
**What goes wrong:** The Next.js page cache serves stale data after an employee or vacation record is added/updated/deleted.
**Why it happens:** Next.js caches aggressively; without explicit revalidation, pages continue serving the cached version.
**How to avoid:** Call `revalidatePath('/')` at the end of every mutation Server Action. Since Phase 3 hasn't defined routes yet, `'/'` is the safe default — update to specific paths in Phase 3.

### Pitfall 5: Server Action Signatures with Object Arguments
**What goes wrong:** Server Actions invoked from Client Components serialize arguments via POST. Plain objects work fine; class instances, Date objects, and functions do not serialize.
**Why it happens:** Server Actions cross a network boundary under the hood.
**How to avoid:** Pass primitive values and plain objects only. Pass dates as ISO strings (`'2026-01-01'`), not `Date` instances. This matches the existing Electron IPC pattern.

### Pitfall 6: `drizzle-kit push` Drops Columns on Schema Change
**What goes wrong:** If the schema is changed and `push` is run again, drizzle-kit may prompt to drop columns that no longer exist in the schema.
**Why it happens:** Push is "schema-state" driven — it compares current DB state to desired state.
**How to avoid:** For Phase 2, this is a fresh database so it's safe. For future schema changes, be careful or switch to `generate + migrate`.

---

## Code Examples

Verified patterns from official sources:

### Select with filter and order
```typescript
// Source: https://orm.drizzle.team/docs/select
import { eq, asc } from 'drizzle-orm';

const activeEmployees = await db
  .select()
  .from(employees)
  .where(eq(employees.isActive, true))
  .orderBy(asc(employees.fullName));
```

### Insert with returning
```typescript
// Source: https://orm.drizzle.team/docs/connect-neon
const [newEmployee] = await db
  .insert(employees)
  .values({
    fullName: 'Іванов Іван Іванович',
    hireDate: '2026-01-15',
    isDeel: false,
  })
  .returning();
```

### Update with returning
```typescript
const [updated] = await db
  .update(employees)
  .set({ fullName: data.fullName, hireDate: data.hireDate })
  .where(eq(employees.id, data.id))
  .returning();
```

### Delete with cascade
```typescript
// Mirrors Electron deleteEmployee: first delete records, then employee
await db.delete(vacationRecords).where(eq(vacationRecords.employeeId, id));
await db.delete(employees).where(eq(employees.id, id));
```

### Inferring TypeScript types from schema
```typescript
// Source: Drizzle ORM type inference
import { employees, vacationRecords } from '@/lib/db/schema';

type Employee = typeof employees.$inferSelect;
type NewEmployee = typeof employees.$inferInsert;
type VacationRecord = typeof vacationRecords.$inferSelect;
```

### Server Action with discriminated union return
```typescript
// Source: https://nextjs.org/docs/app/api-reference/directives/use-server
'use server';
import { revalidatePath } from 'next/cache';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function addEmployeeAction(
  input: NewEmployee
): Promise<ActionResult<Employee>> {
  try {
    const [data] = await db.insert(employees).values(input).returning();
    revalidatePath('/');
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
```

### vacationLogic.ts — import at top of TS file
```typescript
// date-fns must be installed: npm install date-fns
// The JS module logic is 1:1 portable; only change is adding TypeScript types
import { parseISO, isAfter, isBefore, isEqual } from 'date-fns';

export const RESET_DATE = new Date('2026-01-01T00:00:00');
export const DAYS_PER_MONTH = 2;

// All functions remain pure — no DB calls, no async
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Electron IPC channels (ipcMain/ipcRenderer) | Next.js Server Actions ('use server') | Phase 2 | Replaces all IPC channels; same function signatures |
| better-sqlite3 synchronous calls | Drizzle ORM async queries via Neon HTTP | Phase 2 | All service functions must be async; awaited |
| SQLite TEXT for dates | PostgreSQL DATE with `mode: 'string'` | Phase 2 | Same string format; no behavioral change |
| SQLite INTEGER 0/1 booleans | PostgreSQL BOOLEAN | Phase 2 | Drizzle maps to JS boolean; must convert any 0/1 checks |
| drizzle-zod (external package) | drizzle-orm built-in zod integration | drizzle-orm v0.30.0 | Import `createInsertSchema` from `'drizzle-orm/zod'` not `'drizzle-zod'` |

**Deprecated/outdated:**
- `drizzle-zod` npm package: Deprecated as of drizzle-orm 0.30.0. Use `import { createInsertSchema } from 'drizzle-orm/zod'` instead.
- `serial()` primary key: Still works but `integer().primaryKey().generatedAlwaysAsIdentity()` is the current recommended pattern.

---

## Open Questions

1. **Column naming convention choice (camelCase keys vs explicit SQL names)**
   - What we know: Two valid options exist — explicit `varchar('full_name', ...)` or `casing: 'snake_case'` on the drizzle client
   - What's unclear: Which approach the planner should standardize on for this project
   - Recommendation: Use explicit column names in pgTable (Option A). It is visible at the schema definition site and does not require modifying the already-established `src/lib/db/index.ts` beyond adding the schema import.

2. **Seed script execution context (tsx script vs Neon migration)**
   - What we know: The Electron app seeds in `initialize()`. For the web app, there is no "app startup" in the same sense.
   - What's unclear: Whether to seed via a `tsx` script run manually, or via a Next.js Route Handler triggered once
   - Recommendation: `npx tsx src/scripts/seed.ts` run once manually. Simple, explicit, zero framework dependency. The script is not run at deploy time.

3. **Foreign key cascade behavior**
   - What we know: The Electron app manually deletes vacation_records before deleting an employee in the service layer (not via DB cascades).
   - What's unclear: Whether to add `ON DELETE CASCADE` to the FK in the Drizzle schema or preserve the manual delete pattern
   - Recommendation: Preserve the manual delete pattern in the service layer to match Electron behavior exactly and avoid surprise cascades during Phase 2.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found |
| Config file | None — Wave 0 must create |
| Quick run command | `npx jest --testPathPattern=vacationLogic` (after Wave 0 setup) |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SVC-04 | vacationLogic.ts calculateEmployeeBalance matches Electron output | unit | `npx jest src/lib/utils/vacationLogic.test.ts` | Wave 0 |
| SVC-04 | calculateEarnedDays, calculateUsedDays, calculatePeriodDays | unit | same | Wave 0 |
| DB-01/02 | Schema push succeeds without error | smoke | `npx drizzle-kit push` exits 0 | N/A — CLI |
| DB-03 | Seed script inserts correct counts | smoke | `npx tsx src/scripts/seed.ts` + manual count | Wave 0 |
| ACT-01–07 | Server Actions return { success: true } with valid input | integration | manual-only (requires live Neon) | manual |

**Note on integration tests:** ACT-01–07 require a live Neon database connection. Unit tests for vacationLogic.ts are fully automated and high-value since this is the core business logic. Integration tests for Server Actions are marked manual-only for Phase 2; they will be exercised in Phase 3 UI testing.

### Sampling Rate

- **Per task commit:** `npx jest src/lib/utils/vacationLogic.test.ts --passWithNoTests`
- **Per wave merge:** `npx jest`
- **Phase gate:** `drizzle-kit push` succeeds + seed script exits without error + jest passes

### Wave 0 Gaps

- [ ] `src/lib/utils/vacationLogic.test.ts` — unit tests for all 6 exported functions
- [ ] `jest.config.ts` — Jest config for Next.js TypeScript project (needs `ts-jest` or `babel-jest` + next/jest transform)
- [ ] Framework install: `npm install --save-dev jest @types/jest ts-jest jest-environment-node`
- [ ] `src/scripts/seed.ts` — seed script file

---

## Sources

### Primary (HIGH confidence)

- `https://orm.drizzle.team/docs/sql-schema-declaration` — pgTable, pgEnum, column types
- `https://orm.drizzle.team/docs/column-types/pg` — All pg-core column builders
- `https://orm.drizzle.team/docs/connect-neon` — neon-http setup, schema wiring, returning()
- `https://orm.drizzle.team/docs/select` — select, filter operators, orderBy
- `https://nextjs.org/docs/app/api-reference/directives/use-server` — 'use server' directive (version 16.1.6, updated 2026-02-27)
- `https://nextjs.org/docs/app/getting-started/updating-data` — Server Actions CRUD patterns with revalidatePath (version 16.1.6, updated 2026-02-27)
- `/Users/dariakozova/Documents/vacation-dashboard/src/db/db.js` — Authoritative schema and seed data (SQLite source of truth)
- `/Users/dariakozova/Documents/vacation-dashboard/src/utils/vacationLogic.js` — Business logic to port

### Secondary (MEDIUM confidence)

- `https://orm.drizzle.team/docs/zod` — drizzle-orm built-in zod integration (createInsertSchema, createSelectSchema)
- `https://neon.com/docs/guides/drizzle-migrations` — drizzle-kit push vs generate/migrate guidance

### Tertiary (LOW confidence)

- WebSearch results on date column modes and casing options — corroborated by official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all core deps already installed; versions confirmed in package.json
- Architecture: HIGH — patterns verified against current Next.js 16.1.6 and Drizzle 0.45 official docs
- Schema mapping: HIGH — source schema is fully visible in Electron db.js; PostgreSQL column types confirmed
- Pitfalls: HIGH — column naming and date mode pitfalls confirmed in Drizzle docs and GitHub issues
- Business logic port: HIGH — vacationLogic.js is pure TypeScript-compatible JS; date-fns already used

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days; Drizzle and Next.js APIs in this version range are stable)
