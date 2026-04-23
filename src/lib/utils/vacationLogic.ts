import { parseISO, isBefore, differenceInYears } from 'date-fns'

export const RESET_DATE = new Date('2026-01-01T00:00:00')
export const DAYS_PER_MONTH = 2
export const SYSTEM_START_YEAR = 2023

// ── Input types ─────────────────────────────────────────────────────────────

export type VacationRecordInput = {
  id?: number
  record_type: 'period' | 'days_sum' | 'balance_reset'
  vacation_type?: string  // 'main' | 'ubd' | 'social'
  start_date?: string | null
  end_date?: string | null
  days_count?: number | null
  year?: number | null
  note?: string | null
  submitted_on_time?: boolean
  status?: string | null  // 'approved' | 'pending' | 'declined'
  source?: string | null  // 'manual' | 'sage'
  sage_id?: number | null
}

export type EmployeeInput = {
  hire_date: string
  annual_base_days?: number
  is_single_parent?: boolean
  single_parent_since?: string | null
  [key: string]: unknown
}

export type EmployeeCategoryInput = {
  category: string        // 'disability_1' | 'disability_2' | 'disability_3' | 'combat_veteran'
  since?: string | null
  effective_to?: string | null
}

export type EmployeeChildInput = {
  birth_date: string
  is_raised_alone?: boolean
}

// ── Pool A: Base vacation (accumulates, never expires) ──────────────────────

/**
 * Returns the annual base vacation days based on disability category.
 * Disability replaces the default 24 — it does NOT add extra days.
 */
export function getAnnualBaseDays(categories: EmployeeCategoryInput[]): number {
  if (categories.some(c => c.category === 'disability_1' || c.category === 'disability_2')) return 30
  if (categories.some(c => c.category === 'disability_3')) return 26
  return 24
}

/**
 * Calculates earned vacation days from hireDate to toDate.
 * Formula: round(totalCalendarDays / 365 * annualBaseDays)
 */
export function calculateEarnedDays(hireDate: string | Date, toDate: Date | string, annualBaseDays: number = 24): number {
  const start = typeof hireDate === 'string' ? parseISO(hireDate) : new Date(hireDate)
  const end = typeof toDate === 'string' ? parseISO(toDate) : new Date(toDate)
  const days = Math.floor((end.getTime() - start.getTime() + 86400000) / 86400000)
  return Math.round((days / 365) * annualBaseDays)
}

/**
 * Calculates total used MAIN vacation days from records within [fromDate, toDate).
 * Skips 'ubd' and 'social' vacation types — those are separate pools.
 */
export function calculateUsedDays(
  records: VacationRecordInput[],
  fromDate: Date | string,
  toDate: Date | string
): number {
  const from = fromDate instanceof Date ? fromDate : new Date(fromDate)
  const to = toDate instanceof Date ? toDate : new Date(toDate)
  const cutoff2026 = new Date(2026, 0, 1)

  return records.reduce((total, record) => {
    if (record.record_type === 'balance_reset') return total

    // Pending records do not affect balance
    if (record.status === 'pending') return total

    // Skip special vacations from Pool A balance
    if (record.vacation_type === 'ubd' || record.vacation_type === 'social') return total

    if (record.record_type === 'days_sum') {
      const yearStart = record.year ? new Date(record.year, 0, 1) : new Date(2000, 0, 1)
      if (!isBefore(yearStart, from) && isBefore(yearStart, to)) {
        return total + (record.days_count || 0)
      }
    } else if (record.record_type === 'period') {
      if (!record.start_date) return total
      const startDate =
        typeof record.start_date === 'string' ? parseISO(record.start_date) : new Date(record.start_date)
      // Pre-2026 period records are for display only (covered by days_sum)
      if (isBefore(startDate, cutoff2026)) return total
      if (!isBefore(startDate, from) && isBefore(startDate, to)) {
        return total + (record.days_count || 0)
      }
    }
    return total
  }, 0)
}

// ── Pool B: Combat veteran / УБД (calendar year, does NOT accumulate) ──────

/**
 * Returns 14 if employee has combat_veteran category, 0 otherwise.
 * Full entitlement on Jan 1 regardless of hire date.
 */
export function getUBDEntitlement(categories: EmployeeCategoryInput[]): number {
  return categories.some(c => c.category === 'combat_veteran') ? 14 : 0
}

/**
 * Returns total UBD days used in a specific calendar year.
 */
export function getUBDUsed(records: VacationRecordInput[], year: number): number {
  return records
    .filter(r => r.vacation_type === 'ubd' && r.status !== 'pending' && getRecordYear(r) === year)
    .reduce((sum, r) => sum + (r.days_count ?? 0), 0)
}

// ── Pool C: Social vacation / діти (calendar year, ACCUMULATES) ─────────────

/**
 * Returns true if any child has is_raised_alone=true,
 * OR falls back to employee.is_single_parent for backward compatibility.
 */
export function isSingleParentForPoolC(
  employee: EmployeeInput,
  children: EmployeeChildInput[]
): boolean {
  if (children.some(c => c.is_raised_alone === true)) return true
  return !!employee.is_single_parent
}

/**
 * Determines the year when the qualifying event first occurred for Pool C.
 * - Single parent: year of single_parent_since or first child
 * - General case: year when second child was born (need 2+ under 15)
 */
export function yearWhenQualifyingEventOccurred(
  employee: EmployeeInput,
  children: EmployeeChildInput[]
): number {
  const singleParent = isSingleParentForPoolC(employee, children)
  if (singleParent && employee.single_parent_since) {
    return new Date(employee.single_parent_since).getFullYear()
  }
  const sorted = [...children].sort(
    (a, b) => new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime()
  )
  if (singleParent && sorted.length >= 1) {
    return new Date(sorted[0].birth_date).getFullYear()
  }
  if (!singleParent && sorted.length >= 2) {
    return new Date(sorted[1].birth_date).getFullYear()
  }
  return 9999 // no qualifying event
}

/**
 * Calculates social vacation entitlement for a specific calendar year.
 * Age cutoffs: under 15 for general case, under 18 for single parent.
 * Max per year: 17 days (Art. 19 cap).
 * Entitlement for full year — not prorated.
 */
export function getSocialEntitlementForYear(
  employee: EmployeeInput,
  children: EmployeeChildInput[],
  year: number
): number {
  const dec31 = new Date(year, 11, 31)
  const singleParent = isSingleParentForPoolC(employee, children)

  if (singleParent) {
    // Single parent: children under 18 as of Dec 31
    const eligible = children.filter(c =>
      differenceInYears(dec31, new Date(c.birth_date)) < 18
    ).length
    if (eligible >= 2) return 17
    if (eligible === 1) return 10
    return 0
  } else {
    // General case: children under 15 as of Dec 31
    const under15 = children.filter(c =>
      differenceInYears(dec31, new Date(c.birth_date)) < 15
    ).length
    if (under15 >= 2) return 10
    return 0
  }
}

/**
 * Calculates total social vacation earned across all years from firstYear to currentYear.
 * Accumulates indefinitely — unused days carry over.
 */
export function getTotalSocialEarned(
  employee: EmployeeInput,
  children: EmployeeChildInput[],
  currentYear: number
): number {
  const hireYear = new Date(employee.hire_date).getFullYear()
  const qualifyingYear = yearWhenQualifyingEventOccurred(employee, children)
  const firstYear = Math.max(SYSTEM_START_YEAR, hireYear, qualifyingYear)

  let total = 0
  for (let y = firstYear; y <= currentYear; y++) {
    total += getSocialEntitlementForYear(employee, children, y)
  }
  return total
}

/**
 * Returns total social vacation days used (all-time).
 */
export function getSocialUsed(records: VacationRecordInput[]): number {
  return records
    .filter(r => r.vacation_type === 'social' && r.status !== 'pending')
    .reduce((sum, r) => sum + (r.days_count ?? 0), 0)
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Extract the calendar year from a vacation record. */
function getRecordYear(r: VacationRecordInput): number | null {
  if (r.year) return r.year
  if (r.start_date) return new Date(r.start_date).getFullYear()
  return null
}

/**
 * Helper: get active categories at a given date.
 * A category is active if since <= asOf and (effectiveTo is null or effectiveTo >= asOf).
 */
function getActiveCategories(categories: EmployeeCategoryInput[], asOf: Date): EmployeeCategoryInput[] {
  return categories.filter(c => {
    if (!c.since) return true // no start date = always active
    const from = parseISO(c.since)
    const to = c.effective_to ? parseISO(c.effective_to) : null
    return from <= asOf && (!to || to >= asOf)
  })
}

// ── Result types ────────────────────────────────────────────────────────────

export type UBDBalance = {
  year: number
  entitled: number   // 0 or 14
  used: number
  remaining: number
}

export type SocialBalance = {
  totalEarned: number            // cumulative since firstYear
  used: number                   // all-time
  remaining: number
  currentYearEntitlement: number // entitlement for the current calendar year
}

export type EmployeeBalanceResult = {
  annualBaseDays: number
  earned: number
  used2024: number
  used2025: number
  used2026: number
  balance: number
  wasReset: boolean
  resetDays: number
  ubdBalance: UBDBalance
  socialBalance: SocialBalance
  activeCategories: EmployeeCategoryInput[]
}

// ── Main balance calculation ────────────────────────────────────────────────

/**
 * Full balance calculation for a single employee across all three pools.
 */
export function calculateEmployeeBalance(
  employee: EmployeeInput,
  records: VacationRecordInput[],
  categories: EmployeeCategoryInput[] = [],
  children: EmployeeChildInput[] = [],
  asOfDate: Date | string = new Date()
): EmployeeBalanceResult {
  const hireDate =
    typeof employee.hire_date === 'string' ? parseISO(employee.hire_date) : new Date(employee.hire_date)
  const asOf = asOfDate instanceof Date ? asOfDate : new Date(asOfDate)
  const currentYear = asOf.getFullYear()

  const activeCategories = getActiveCategories(categories, asOf)

  // ── Pool A ──────────────────────────────────────────────────────────────
  const annualBaseDays = getAnnualBaseDays(activeCategories)

  const start2024 = new Date(2024, 0, 1)
  const start2025 = new Date(2025, 0, 1)
  const start2026 = new Date(2026, 0, 1)
  const start2027 = new Date(2027, 0, 1)
  const epoch = new Date(2000, 0, 1)

  const used2024 = calculateUsedDays(records, start2024, start2025)
  const used2025 = calculateUsedDays(records, start2025, start2026)
  const used2026 = calculateUsedDays(records, start2026, start2027)

  // Balance at the reset date
  const earnedToReset = calculateEarnedDays(hireDate, RESET_DATE, annualBaseDays)
  const usedBeforeReset = calculateUsedDays(records, epoch, start2026)
  const balanceAtReset = earnedToReset - usedBeforeReset

  const wasReset = balanceAtReset < 0
  const resetDays = wasReset ? Math.abs(balanceAtReset) : 0

  // Total earned
  const totalEarned = wasReset
    ? calculateEarnedDays(RESET_DATE, asOf, annualBaseDays)
    : calculateEarnedDays(hireDate, asOf, annualBaseDays)

  // Current balance
  const baseBalance = wasReset ? 0 : balanceAtReset
  const earnedSinceReset = calculateEarnedDays(RESET_DATE, asOf, annualBaseDays)
  const balance = baseBalance + earnedSinceReset - used2026

  // ── Pool B — UBD ────────────────────────────────────────────────────────
  const ubdEntitled = getUBDEntitlement(activeCategories)
  const ubdUsed = getUBDUsed(records, currentYear)
  const ubdBalance: UBDBalance = {
    year: currentYear,
    entitled: ubdEntitled,
    used: ubdUsed,
    remaining: ubdEntitled - ubdUsed,
  }

  // ── Pool C — Social ─────────────────────────────────────────────────────
  const socialTotalEarned = getTotalSocialEarned(employee, children, currentYear)
  const socialUsed = getSocialUsed(records)
  const socialCurrentYear = getSocialEntitlementForYear(employee, children, currentYear)
  const socialBalance: SocialBalance = {
    totalEarned: socialTotalEarned,
    used: socialUsed,
    remaining: socialTotalEarned - socialUsed,
    currentYearEntitlement: socialCurrentYear,
  }

  return {
    annualBaseDays,
    earned: totalEarned,
    used2024,
    used2025,
    used2026,
    balance,
    wasReset,
    resetDays,
    ubdBalance,
    socialBalance,
    activeCategories,
  }
}

// ── Utility functions ───────────────────────────────────────────────────────

/**
 * Calculates days between two dates, inclusive of both endpoints.
 */
export function calculatePeriodDays(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate)
  const end = typeof endDate === 'string' ? parseISO(endDate) : new Date(endDate)
  const diffMs = Math.abs(end.getTime() - start.getTime())
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
}

/**
 * Calculates how many additional days will be accrued from asOfDate to 31.12 of current year.
 */
export function calculateForecastDays(
  employee: EmployeeInput,
  asOfDate: Date | string = new Date()
): number {
  const annualBaseDays = employee.annual_base_days || 24
  const currentYear = new Date().getFullYear()
  const endOfYear = new Date(currentYear, 11, 31)
  const asOf = asOfDate instanceof Date ? asOfDate : new Date(asOfDate)

  if (!isBefore(asOf, endOfYear)) return 0

  const earnedToEnd = calculateEarnedDays(RESET_DATE, endOfYear, annualBaseDays)
  const earnedToNow = calculateEarnedDays(RESET_DATE, asOf, annualBaseDays)
  return Math.max(0, earnedToEnd - earnedToNow)
}

type WorkingYearResult = {
  yearNumber: number
  periodStart: string
  periodEnd: string
  daysTaken: number
  daysUsedInPeriod: number
  daysAvailableInPeriod: number
}

/**
 * Determines which working year(s) a vacation period record is assigned to using FIFO logic.
 * Annual base days are now derived from categories if available.
 */
export function getVacationWorkingYear(
  employee: EmployeeInput & { wasReset?: boolean },
  allRecords: VacationRecordInput[],
  targetRecord: VacationRecordInput | null
): WorkingYearResult | WorkingYearResult[] | null {
  // Only apply FIFO to main annual records
  if (!targetRecord || targetRecord.record_type !== 'period' || (targetRecord.vacation_type && targetRecord.vacation_type !== 'main')) return null

  const MAX_PER_YEAR = employee.annual_base_days || 24

  const hireDateStr = employee.hire_date || '2026-01-01'
  const [hy, hm, hd] = hireDateStr.split('-').map(Number)
  const hireDate = new Date(hy, hm - 1, hd)

  function buildWorkingYears(from: Date, count = 20): { n: number; start: Date; end: Date; used: number }[] {
    const years = []
    let start = new Date(from)
    for (let i = 0; i < count; i++) {
      const end = new Date(start)
      end.setFullYear(end.getFullYear() + 1)
      end.setDate(end.getDate() - 1)
      years.push({ n: i + 1, start: new Date(start), end: new Date(end), used: 0 })
      start = new Date(end)
      start.setDate(start.getDate() + 1)
    }
    return years
  }

  const workingYears = buildWorkingYears(hireDate)

  // Only take into account main/annual periods
  const periods = allRecords
    .filter(r => r.record_type === 'period' && r.start_date && (!r.vacation_type || r.vacation_type === 'main'))
    .sort((a, b) =>
      (a.start_date! < b.start_date! ? -1 : a.start_date! > b.start_date! ? 1 : 0)
    )

  const fmt = (d: Date) =>
    d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })

  let result: WorkingYearResult | WorkingYearResult[] | null = null

  for (const record of periods) {
    let remaining = record.days_count || 0
    const splits: WorkingYearResult[] = []

    for (const wy of workingYears) {
      if (remaining <= 0) break
      const available = MAX_PER_YEAR - wy.used
      if (available <= 0) continue

      const take = Math.min(remaining, available)
      wy.used += take
      remaining -= take

      splits.push({
        yearNumber: wy.n,
        periodStart: fmt(wy.start),
        periodEnd: fmt(wy.end),
        daysTaken: take,
        daysUsedInPeriod: wy.used,
        daysAvailableInPeriod: MAX_PER_YEAR,
      })
    }

    if (record.id === targetRecord.id) {
      result = splits.length === 1 ? splits[0] : splits
      break
    }
  }

  return result
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
