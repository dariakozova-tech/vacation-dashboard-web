---
phase: 04-read-only-ui
verified: 2026-03-25T00:00:00Z
status: human_needed
score: 8/8 must-haves verified
human_verification:
  - test: "Open the app at http://localhost:3000 and confirm the sidebar renders with 'Відпустки' label and 'ТОВ «Текері»' company name, two nav buttons (Співробітники / Аналітика), and the employee count in the footer."
    expected: "Sidebar visible with correct Ukrainian text, lucide-react icons (Users, BarChart2), and employee count matching the DB."
    why_human: "CSS rendering, font application, and backdrop-filter blur cannot be verified programmatically."
  - test: "On the Employees tab, verify: (a) TOV and Deel sections appear as separate groups; (b) search by name filters the table in real time; (c) clicking a column header sorts ascending then descending; (d) clicking a row expands the detail panel with vacation records and working-year badges."
    expected: "Table behaves as described. Expand/collapse animates via CSS max-height transition. Balance chips show green/orange/red based on value thresholds."
    why_human: "Interactive table behavior, animation, and correct threshold coloring of balance chips require visual and interaction testing."
  - test: "On the Employees tab, find one of the two employees known to have been reset (Бондаренко Олексій or Мельник Дмитро) and confirm: (a) a warning badge appears beside the name; (b) the tooltip on hover shows the correct pre-reset negative days; (c) the detail panel shows the 'Обнулення 01.01.2026' banner."
    expected: "wasReset flag triggers the warning badge and pre-2026 summary section correctly."
    why_human: "Requires identifying specific employees in live DB data and visually confirming tooltip text."
  - test: "Switch to the Analytics tab and confirm: (a) 4 KPI cards render with real numbers; (b) 4 recharts charts render (monthly bar, year comparison bar, top-10 horizontal bar, earned-vs-used line); (c) the All/TOV/Deel segmented filter changes the chart data; (d) changing the forecast date updates the forecast table."
    expected: "All charts render with visible bars/lines. Segment filter causes data to change visibly. Forecast date picker is interactive."
    why_human: "recharts rendering requires a live browser. SSR hydration issues with ResponsiveContainer (which uses numeric heights) can only be confirmed visually."
  - test: "Confirm the Apple-style design system: background is light grey (#F5F5F7), surfaces are white, accent blue is #0071E3, font is SF Pro / -apple-system. No Electron-specific styles (no -webkit-app-region drag regions, no #root block)."
    expected: "Page looks visually consistent with the Electron app. No browser default serif fonts."
    why_human: "Visual design fidelity and font rendering require human inspection."
---

# Phase 04: Read-Only UI Verification Report

**Phase Goal:** Port the complete read-only UI from the Electron app to the Next.js web app — employees table, analytics dashboard, Apple-style CSS, sidebar navigation.
**Verified:** 2026-03-25
**Status:** human_needed (all automated checks passed; visual/interaction items remain for human)
**Re-verification:** No — initial verification.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | App shell exists with sidebar navigation (Employees / Analytics) | VERIFIED | `AppShell.tsx` (65 lines): `'use client'`, `useState` tab switching, `Users`/`BarChart2` lucide icons, `.sidebar` / `.nav-item.active` CSS classes |
| 2 | Apple-style CSS design token system is applied | VERIFIED | `globals.css` (939 lines): `--accent: #0071E3`, SF Pro font stack, full token set. No `#root` block. No `-webkit-app-region`. `user-select: none` only on `th` (intentional), not `body`. |
| 3 | Page data is fetched server-side from Neon (no `'use client'` in page.tsx) | VERIFIED | `page.tsx`: async RSC, `Promise.all([getEmployees(), getAllVacationRecords()])`, no `'use client'` directive. Services call `db.select()` against Drizzle/Neon. |
| 4 | Employees table renders with sortable columns, search, TOV/Deel groups, and balance chips | VERIFIED | `EmployeesTab.tsx` (314 lines): `useMemo` sort+filter, `COLUMNS` array with 7 sortable keys, `tovFiltered`/`deelFiltered` split, `BalanceChip` component with positive/warning/danger thresholds |
| 5 | Expandable row detail panel shows vacation records and working-year badges | VERIFIED | `EmployeeDetail.tsx` (359 lines): year-tab navigation, `getVacationWorkingYear()` called per record, `WorkingYearBadge` with tooltip, pre-2026 summary section, `wasReset` banner |
| 6 | Tooltip component works with 200ms delay | VERIFIED | `Tooltip.tsx` (48 lines): `setTimeout(() => setVisible(true), 200)`, cursor-following `onMouseMove`, `position: fixed` portal via inline style |
| 7 | Analytics dashboard renders KPI cards, 4 recharts charts, group filter, forecast table | VERIFIED | `AnalyticsTab.tsx` (448 lines): 4 KPI cards, `BarChart`/`LineChart` from recharts 2.x, `groupFilter` state, `forecastDate` date picker, `useMemo` data pipelines |
| 8 | Data flows end-to-end: Neon DB → services → RSC → AppShell → tab components | VERIFIED | `page.tsx` imports `getEmployees`/`getAllVacationRecords` (confirmed real DB queries), remaps to snake_case, computes `calculateEmployeeBalance`, passes `employeesWithBalance` + `allRecordsSnake` to `<AppShell>`, which passes to `<EmployeesTab employees={employees}>` and `<AnalyticsTab employees={employees} allRecords={allRecords}>` |

**Score:** 8/8 truths verified (automated)

---

### Required Artifacts

| Artifact | Lines | Status | Details |
|----------|-------|--------|---------|
| `src/app/globals.css` | 939 | VERIFIED | Full Apple-style token system. Electron-specific CSS removed. |
| `src/app/layout.tsx` | 19 | VERIFIED | `lang="uk"`, Ukrainian metadata, no Geist font import |
| `src/app/page.tsx` | 48 | VERIFIED | Async RSC, parallel data fetch, snake_case remap, balance computation |
| `src/components/AppShell.tsx` | 65 | VERIFIED | `'use client'`, sidebar, tab state, EmployeesTab + AnalyticsTab wired |
| `src/components/EmployeesTab.tsx` | 314 | VERIFIED | Search, multi-column sort, TOV/Deel split, BalanceChip, expand row |
| `src/components/EmployeeDetail.tsx` | 359 | VERIFIED | Year-tab navigation, working-year badges, pre-2026 summary, reset banner |
| `src/components/Tooltip.tsx` | 48 | VERIFIED | 200ms delay, cursor-following, fixed-position portal |
| `src/components/AnalyticsTab.tsx` | 448 | VERIFIED | 4 KPI cards, 4 recharts charts, group filter, forecast date picker + table |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `page.tsx` | `getEmployees()` | direct import | WIRED | `import { getEmployees } from '@/lib/services/employees'`; return passed to AppShell |
| `page.tsx` | `getAllVacationRecords()` | direct import | WIRED | `import { getAllVacationRecords } from '@/lib/services/vacationRecords'`; return passed to AppShell |
| `page.tsx` | `calculateEmployeeBalance()` | direct import | WIRED | `import { calculateEmployeeBalance } from '@/lib/utils/vacationLogic'`; result spread onto employee objects |
| `AppShell.tsx` | `EmployeesTab` | import + JSX | WIRED | `import EmployeesTab from './EmployeesTab'`; rendered as `<EmployeesTab employees={employees} />` |
| `AppShell.tsx` | `AnalyticsTab` | import + JSX | WIRED | `import AnalyticsTab from './AnalyticsTab'`; rendered as `<AnalyticsTab employees={employees} allRecords={allRecords} />` |
| `EmployeesTab.tsx` | `EmployeeDetail` | import + JSX | WIRED | `import EmployeeDetail from './EmployeeDetail'`; rendered inside expand row when `expandedId === emp.id` |
| `EmployeesTab.tsx` | `Tooltip` | import + JSX | WIRED | `import Tooltip from './Tooltip'`; used on `reset-badge` for wasReset employees |
| `EmployeeDetail.tsx` | `getVacationWorkingYear()` | direct import | WIRED | Called inside `WorkingYearBadge` per record; result rendered as badge text |
| `AnalyticsTab.tsx` | `calculateEarnedDays` / `calculateUsedDays` / `calculateEmployeeBalance` | direct import | WIRED | All three used inside `useMemo` hooks for line chart and forecast table data |
| `services/employees.ts` | Neon DB | `db.select().from(employees)` | WIRED | Uses `drizzle-orm`, `eq`, `asc`; returns actual DB rows |
| `services/vacationRecords.ts` | Neon DB | `db.select().from(vacationRecords)` | WIRED | Returns actual DB rows ordered by employeeId and startDate |

---

### Requirements Coverage

No `REQUIREMENTS.md` file exists in this project. Requirement IDs (UI-01 through UI-07, UI-13) are referenced only within phase 4 SUMMARY files. Mapping below is inferred from phase goal and component evidence:

| Requirement ID | Inferred Description | Status | Evidence |
|---------------|---------------------|--------|----------|
| UI-01 | Sidebar navigation with two tabs | SATISFIED | `AppShell.tsx` sidebar with Employees + Analytics nav buttons |
| UI-02 | Employees table with columns | SATISFIED | `EmployeesTab.tsx`: ПІБ, Дата прийому, Зароблено, Викор. 2024/2025/2026, Залишок |
| UI-03 | Balance chips (positive/warning/danger) | SATISFIED | `BalanceChip` in `EmployeesTab.tsx` with correct thresholds; CSS classes in `globals.css` |
| UI-04 | Expandable row detail with vacation records | SATISFIED | `EmployeeDetail.tsx`: year-tab navigation, records table, working-year badges |
| UI-05 | Analytics dashboard with charts | SATISFIED | `AnalyticsTab.tsx`: 4 recharts charts, KPI cards, group filter, forecast table |
| UI-06 | Apple-style CSS design system | SATISFIED | `globals.css` 939 lines: full token system ported from Electron app |
| UI-07 | TOV / Deel group split in employees table | SATISFIED | `tovFiltered`/`deelFiltered` memos + separate section headers in `EmployeesTab.tsx` |
| UI-13 | Working-year badges in employee detail | SATISFIED | `WorkingYearBadge` component in `EmployeeDetail.tsx` using `getVacationWorkingYear()` |

**Note:** No REQUIREMENTS.md found — these IDs are not formally defined outside SUMMARY files. The mapping above is based on component implementation evidence. If a formal requirements document is later added, these mappings should be cross-checked.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `EmployeesTab.tsx` | 9 | `AppShellProps: employees: any[]` (in AppShell, not EmployeesTab) — both use `any[]` for employee props | Info | Type safety deferred to Phase 5; noted in decisions. No runtime risk. |
| `AnalyticsTab.tsx` | 75 | `employees: any[]` / `allRecords: any[]` props | Info | Same as above — intentional Phase 5 deferral. |
| `EmployeesTab.tsx` | 167 | `employee={emp as any}` cast to pass to EmployeeDetail | Info | Documented in Phase decisions; Phase 5 will consolidate types. |

No blockers. No TODO/FIXME/placeholder comments. No empty return stubs. No orphaned imports. All `return null` usages are legitimate early returns for empty states (e.g., `EmployeeTable` with zero rows, `WorkingYearBadge` with null info, `CustomTooltip` when inactive).

---

### Human Verification Required

#### 1. Sidebar and app shell visual rendering

**Test:** Start `npm run dev`, open `http://localhost:3000`. Confirm the sidebar renders with the "Відпустки" label, "ТОВ «Текері»" company name, two navigation buttons with icons, and employee count in the footer.
**Expected:** Visual appearance matches the Electron app sidebar. Backdrop blur effect visible. Active tab button highlighted in accent blue.
**Why human:** CSS `backdrop-filter`, SF Pro font rendering, and icon rendering from lucide-react cannot be verified without a browser.

#### 2. Employees table interactivity

**Test:** On the Employees tab: (a) type a name fragment in the search box; (b) click a column header twice to sort asc then desc; (c) click any row to expand it; (d) click the same row to collapse it.
**Expected:** Search filters immediately. Sort indicator arrows update. Row expands with smooth animation showing vacation records. Collapse reverses the animation.
**Why human:** CSS `max-height` transition animation and interactive state changes require a live browser.

#### 3. Reset employee warning badge and tooltip

**Test:** Find Бондаренко Олексій or Мельник Дмитро in the employees table. Hover over the warning badge (⚠) next to their name.
**Expected:** Tooltip appears after ~200ms showing "Баланс обнулено 01.01.2026: було −N дн." where N is the correct pre-reset negative balance. Expanding the row shows the orange "Обнулення 01.01.2026 — від'ємний баланс списано" banner.
**Why human:** Requires identifying specific employees in live data and confirming tooltip text + timing.

#### 4. Analytics charts render correctly

**Test:** Switch to the Analytics tab. Confirm all 4 charts are visible with bars/lines. Click "ТОВ" then "Deel" in the segment filter and verify chart data visibly changes. Change the forecast date and verify the forecast table updates.
**Expected:** No blank chart areas. Segment filter noticeably changes totals and chart heights. Forecast table reflects recalculated balances for the new date.
**Why human:** recharts `ResponsiveContainer` and `ResponsiveContainer` with fixed numeric heights can only be confirmed to render without SSR hydration errors in a live browser.

#### 5. Balance chip threshold correctness

**Test:** On the employees table, find employees with balance < 0, balance 0-2, and balance >= 3. Confirm chips are red/orange/green respectively.
**Expected:** Danger chip (red) for negative, warning chip (orange) for 0-2, positive chip (green with + prefix) for 3+.
**Why human:** Requires matching DB balance values against visual chip colors in the rendered table.

---

### Gaps Summary

No automated gaps found. All 8 observable truths are verified by code inspection:

- All 8 required component/page files exist with substantive implementations (1234 total lines across components)
- All key links are wired — data flows from Neon DB through services through RSC through AppShell into both tab components
- recharts (`^2.15.4`) and lucide-react (`^1.0.1`) are present in `package.json`
- Apple-style CSS is ported (939 lines, no Electron-specific rules on body)
- No placeholder, stub, or empty return anti-patterns found
- Requirement IDs UI-01 through UI-07 and UI-13 all map to implemented code

Five human verification items remain, all related to visual rendering, animation, and interactive behavior that can only be confirmed in a live browser. None of these are expected to fail given the completeness of the implementation.

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
