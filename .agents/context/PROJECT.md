# Vacation Dashboard — Project Context

## What this project is

A Next.js web application deployed on Vercel for tracking employee vacation balances at TOV "Tekeri" (Ukrainian IT company, Diia.City resident). Originally built as an Electron desktop app with SQLite, then migrated to Next.js + Vercel Postgres.

**Live URL:** https://vacation-dashboard-web.vercel.app  
**GitHub:** https://github.com/dariakozova-techs-projects/vacation-dashboard-web  
**Stack:** Next.js (App Router), React, Vercel Postgres, deployed on Vercel  
**Language:** TypeScript/JavaScript  
**UI language:** Ukrainian  

---

## Business logic — Ukrainian labor law (Закон "Про відпустки" №504/96-ВР)

### Annual base vacation (щорічна основна відпустка)
- Standard: **24 calendar days** per working year
- Disability group I-II: **30 days**
- Disability group III: **26 days**
- Accrues at **2 days per month** (or adjusted rate for special categories)
- Working year = from hire_date anniversary to next anniversary (NOT calendar year)
- FIFO logic: vacation days deducted from the oldest non-exhausted working year first

### Balance reset rule
Some employees had negative balance as of 01.01.2026. For them:
- `balance_reset = true` in the DB
- Balance (earned minus used) resets to 0 on 2026-01-01
- **Working year periods still count from original hire_date** (this was a bug — previously reset employees had working years calculated from 2026-01-01 instead of hire_date)
- Only the balance counter restarts from zero

### Additional vacation — Combat veterans (ст. 16-2)
- 14 calendar days per calendar year
- Does NOT accumulate — expires Dec 31
- Cannot be split, transferred, or compensated
- Granted regardless of time worked in the year

### Social vacation — Children (ст. 19)
- 10 days (one qualifying reason) or 17 days (two+ reasons) per calendar year
- Qualifying reasons: 2+ children under 15, child with disability under 18, single parent, adoptive parent
- DOES accumulate across years
- Can be compensated at dismissal

---

## Database schema

### Core tables (already exist):
- `employees` — id, full_name, hire_date, email, is_deel, balance_reset, annual_base_days
- `vacation_records` — id, employee_id, record_type ('period'|'summary'), start_date, end_date, days_count, year, note, vacation_type ('annual'|'combat_veteran'|'social_children')

### New tables (to be created — see pending task):
- `employee_categories` — tracks disability groups, combat veteran status, single parent, etc. with effective_from/to dates
- `employee_children` — tracks children with birth_date for age-based eligibility calculations

---

## Current state of development

### What's done:
- Full employee list with 42+ employees
- CRUD for vacation records (add/edit/delete periods)
- Balance calculation with FIFO working year logic
- Employee detail view with vacation periods grouped by year
- Working year badges showing which working year each vacation draws from
- Split display when a vacation spans two working years
- Deel contractors included with separate tracking
- Email field per employee
- Analytics dashboard
- Deployed and live on Vercel

### What's in progress / pending:
1. **Special employee categories architecture** — new DB tables for disability, combat veteran, children
2. **Adjusted vacation rates** — 30 days for disability I-II, 26 for III
3. **Combat veteran vacation tracking** — separate 14-day non-accumulating vacation
4. **Social children vacation** — age-dependent, accumulating
5. **Balance reset fix** — working years must use hire_date, not 2026-01-01
6. **UI for managing categories and children** per employee

### Known employees with special categories:
- **Волошина Олександра Євгенівна** — disability group II (30 days/year)
- **Єрмохін Максим Олексійович** — disability group II (30 days/year) + combat veteran (14 extra non-accumulating)
- **Савченко Кирило Олександрович** — disability group III (26 days/year)

---

## Key files and structure

```
/src
  /app
    /page.tsx          — main dashboard page
    /api/              — API routes for DB operations
  /components/
    /EmployeeDetail.jsx — employee detail card with vacation records
    /VacationForm.jsx   — add/edit vacation record form
  /lib/
    /db.js             — database connection and queries
    /vacationCalc.js   — balance calculation, FIFO logic, getVacationWorkingYear()
```

## Important functions

### getVacationWorkingYear(employee, allRecords, targetRecord)
Calculates which working year(s) a vacation is deducted from using FIFO.
Returns single object or array (if split across two years).

### Balance calculation
Monthly accrual = annual_base_days / 12
Working years start from hire_date
For balance_reset employees: earned/used counters start from 2026-01-01, but working year boundaries still from hire_date

---

## How to run locally
```bash
cd vacation-dashboard-web
npm install
npm run dev
# Opens at http://localhost:3000
```

## How to deploy
Push to `main` branch → Vercel auto-deploys.
```bash
git add -A && git commit -m "description" && git push origin main
```

---

## Coding conventions
- UI text in Ukrainian
- Code comments and variable names in English
- All prompts to the AI agent should be in English for best results
- Use Vercel Postgres for all DB operations (not SQLite)