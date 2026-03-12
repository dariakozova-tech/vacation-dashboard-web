---
phase: 2
slug: schema-services-and-actions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (none detected — Wave 0 installs) |
| **Config file** | `jest.config.ts` — Wave 0 creates |
| **Quick run command** | `npx jest src/lib/utils/vacationLogic.test.ts --passWithNoTests` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest src/lib/utils/vacationLogic.test.ts --passWithNoTests`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green + `drizzle-kit push` succeeds + seed script exits without error
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-W0-01 | 01 | 0 | SVC-04 | unit | `npx jest src/lib/utils/vacationLogic.test.ts` | ❌ W0 | ⬜ pending |
| 2-W0-02 | 01 | 0 | DB-03 | smoke | `npx tsx src/scripts/seed.ts` | ❌ W0 | ⬜ pending |
| 2-01-01 | 01 | 1 | DB-01, DB-02 | smoke | `npx drizzle-kit push` exits 0 | N/A — CLI | ⬜ pending |
| 2-01-02 | 01 | 1 | DB-03 | smoke | `npx tsx src/scripts/seed.ts` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | SVC-01, SVC-02 | manual | manual — call from Server Component | N/A | ⬜ pending |
| 2-02-02 | 02 | 1 | SVC-03 | manual | manual — call from Server Component | N/A | ⬜ pending |
| 2-02-03 | 02 | 1 | SVC-04 | unit | `npx jest src/lib/utils/vacationLogic.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | ACT-01, ACT-02, ACT-03 | manual | manual — requires live Neon | N/A | ⬜ pending |
| 2-03-02 | 03 | 2 | ACT-04, ACT-05, ACT-06, ACT-07 | manual | manual — requires live Neon | N/A | ⬜ pending |
| 2-04-01 | 04 | 2 | DB-04 | manual | manual — import lib/db from client component, verify build error | N/A | ⬜ pending |
| 2-04-02 | 04 | 2 | DB-05 | unit | `npx jest src/lib/utils/vacationLogic.test.ts` | ❌ W0 | ⬜ pending |
| 2-05-01 | 05 | 2 | INFRA-05 | smoke | `npx drizzle-kit push` exits 0 | N/A — CLI | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/utils/vacationLogic.test.ts` — unit tests for all 6 exported functions (calculateEarnedDays, calculateUsedDays, calculatePeriodDays, calculateEmployeeBalance, and helpers)
- [ ] `jest.config.ts` — Jest config for Next.js TypeScript project with `ts-jest` transform
- [ ] Framework install: `npm install --save-dev jest @types/jest ts-jest jest-environment-node`
- [ ] `src/scripts/seed.ts` — seed script stub (actual implementation in Wave 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Service functions return typed rows from Server Component | SVC-01, SVC-02, SVC-03 | Requires live Neon DB + Next.js render | Create temp page that calls service, check browser/server output |
| Server Actions complete with `revalidatePath('/')` | ACT-01–ACT-07 | Requires live Neon DB connection | Call each action from a test UI, verify DB state + no error |
| `lib/db/index.ts` import from Client Component causes build error | DB-04 | Build-time check, not runtime | Add `import { db } from '@/lib/db'` to a `'use client'` file, run `next build`, verify error |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
