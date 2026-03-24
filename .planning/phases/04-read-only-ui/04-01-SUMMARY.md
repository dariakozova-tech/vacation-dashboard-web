---
phase: 04-read-only-ui
plan: "01"
subsystem: ui-foundation
tags: [next.js, css, layout, server-component, client-component, navigation]
dependency_graph:
  requires: []
  provides: [app-shell, globals-css, layout, page-rsc]
  affects: [04-02-employees-tab, 04-03-analytics-tab]
tech_stack:
  added: [lucide-react]
  patterns: [server-component-data-fetching, client-shell, snake-case-remapping]
key_files:
  created:
    - src/components/AppShell.tsx
  modified:
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
decisions:
  - "lucide-react installed for nav icons (Users, BarChart2); recharts deferred to Plan 03"
  - "Props typed as any[] in AppShell — Phase 5 will tighten types"
  - "allRecords snake_case remapping done in page.tsx before passing to AppShell to keep client component free of remapping logic"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_modified: 4
---

# Phase 04 Plan 01: App Foundation — CSS, Layout, RSC Data Fetching, AppShell Summary

**One-liner:** Apple-style CSS tokens + Ukrainian layout + Neon RSC data pipeline feeding a 'use client' AppShell with sidebar navigation and tab switching.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace globals.css and update layout.tsx | 46540aa | src/app/globals.css, src/app/layout.tsx |
| 2 | Create page.tsx (RSC data fetching) and AppShell.tsx (client shell) | f98380d | src/app/page.tsx, src/components/AppShell.tsx |

## What Was Built

### Task 1: globals.css + layout.tsx
- Replaced the 43-line Next.js placeholder CSS with the full 955-line Apple-style design token system from the Electron app
- Applied 4 surgical edits: removed `#root` block (Next.js uses `<body>`, not `#root`), removed `user-select: none` from `body` (web should allow text selection), removed `-webkit-app-region` Electron drag rules, set sidebar `padding-top: 0` (no traffic light buttons in browser)
- `layout.tsx` stripped of Geist fonts, set `lang="uk"`, updated metadata to Ukrainian app title

### Task 2: page.tsx + AppShell.tsx
- `page.tsx` is an async Server Component that fetches employees and all vacation records from Neon in parallel via `Promise.all`
- Remaps camelCase service responses to snake_case for `calculateEmployeeBalance` compatibility
- Computes balance for each employee and attaches `records` array before passing to AppShell
- `AppShell.tsx` is a `'use client'` component with sidebar ("Відпустки" / "ТОВ «Текері»"), two nav buttons (Співробітники / Аналітика using lucide-react icons), employee count footer, topbar title, and placeholder content areas for Plans 02 and 03

## Verification Results

- `npx next build` passes with no TypeScript errors
- `globals.css` contains `--accent: #0071E3`, does NOT contain `#root` or `-webkit-app-region`
- `layout.tsx` does NOT import Geist fonts, has `lang="uk"`
- `page.tsx` does NOT have `'use client'` directive
- `AppShell.tsx` has `'use client'` directive and renders correct Ukrainian sidebar text

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/app/globals.css — EXISTS
- src/app/layout.tsx — EXISTS
- src/app/page.tsx — EXISTS
- src/components/AppShell.tsx — EXISTS
- Commit 46540aa — EXISTS
- Commit f98380d — EXISTS
