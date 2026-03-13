import { parseISO, isBefore } from 'date-fns'

export const RESET_DATE = new Date('2026-01-01T00:00:00')
export const DAYS_PER_MONTH = 2

export type VacationRecordInput = {
  id?: number
  record_type: 'period' | 'days_sum' | 'balance_reset'
  start_date?: string | null
  end_date?: string | null
  days_count?: number | null
  year?: number | null
  note?: string | null
}

export type EmployeeInput = {
  hire_date: string
  [key: string]: unknown
}

/**
 * Calculates earned vacation days from hireDate to toDate.
 * Formula: round(totalCalendarDays / 365 * 24)
 */
export function calculateEarnedDays(hireDate: string | Date, toDate: Date | string): number {
  const start = typeof hireDate === 'string' ? parseISO(hireDate) : new Date(hireDate)
  const end = typeof toDate === 'string' ? parseISO(toDate) : new Date(toDate)
  const days = Math.floor((end.getTime() - start.getTime() + 86400000) / 86400000)
  return Math.round((days / 365) * 24)
}

/**
 * Calculates total used vacation days from records within [fromDate, toDate).
 *
 * Rules:
 * - days_sum records: counted by year (year start must fall in [from, to))
 * - period records: counted only for start_date >= 2026-01-01 (pre-2026 periods
 *   are archived and covered by days_sum totals)
 * - balance_reset records: always skipped
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

export type EmployeeBalanceResult = {
  earned: number
  used2024: number
  used2025: number
  used2026: number
  balance: number
  wasReset: boolean
  resetDays: number
}

/**
 * Full balance calculation for a single employee.
 * Applies the special reset rule: if balance < 0 on 01.01.2026, it's reset to 0.
 *
 * Returns:
 *   earned       - accrued days (from RESET_DATE if wasReset, else from hireDate)
 *   used2024     - vacation days used in 2024
 *   used2025     - vacation days used in 2025
 *   used2026     - vacation days used in 2026
 *   balance      - current available days
 *   wasReset     - true if balance was negative on 01.01.2026
 *   resetDays    - number of days that were forgiven on 01.01.2026
 */
export function calculateEmployeeBalance(
  employee: EmployeeInput,
  records: VacationRecordInput[],
  asOfDate: Date | string = new Date()
): EmployeeBalanceResult {
  const hireDate =
    typeof employee.hire_date === 'string' ? parseISO(employee.hire_date) : new Date(employee.hire_date)
  const asOf = asOfDate instanceof Date ? asOfDate : new Date(asOfDate)

  const start2024 = new Date(2024, 0, 1)
  const start2025 = new Date(2025, 0, 1)
  const start2026 = new Date(2026, 0, 1)
  const start2027 = new Date(2027, 0, 1)
  const epoch = new Date(2000, 0, 1)

  const used2024 = calculateUsedDays(records, start2024, start2025)
  const used2025 = calculateUsedDays(records, start2025, start2026)
  const used2026 = calculateUsedDays(records, start2026, start2027)

  // Balance at the reset date
  const earnedToReset = calculateEarnedDays(hireDate, RESET_DATE)
  const usedBeforeReset = calculateUsedDays(records, epoch, start2026)
  const balanceAtReset = earnedToReset - usedBeforeReset

  const wasReset = balanceAtReset < 0
  const resetDays = wasReset ? Math.abs(balanceAtReset) : 0

  // Total earned: from RESET_DATE if balance was reset (balance forgiven), else from hireDate
  const totalEarned = wasReset
    ? calculateEarnedDays(RESET_DATE, asOf)
    : calculateEarnedDays(hireDate, asOf)

  // Current balance
  const baseBalance = wasReset ? 0 : balanceAtReset
  const earnedSinceReset = calculateEarnedDays(RESET_DATE, asOf)
  const balance = baseBalance + earnedSinceReset - used2026

  return {
    earned: totalEarned,
    used2024,
    used2025,
    used2026,
    balance,
    wasReset,
    resetDays,
  }
}

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
  const currentYear = new Date().getFullYear()
  const endOfYear = new Date(currentYear, 11, 31)
  const asOf = asOfDate instanceof Date ? asOfDate : new Date(asOfDate)

  if (!isBefore(asOf, endOfYear)) return 0

  const earnedToEnd = calculateEarnedDays(RESET_DATE, endOfYear)
  const earnedToNow = calculateEarnedDays(RESET_DATE, asOf)
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
 * Vacation days are deducted from the oldest non-exhausted working year first,
 * regardless of the calendar date of the vacation.
 *
 * Returns null for non-period records.
 * Returns a single object if the vacation fits within one working year.
 * Returns an array of objects if the vacation spans across two working years.
 *
 * Each object: { yearNumber, periodStart, periodEnd, daysTaken, daysUsedInPeriod, daysAvailableInPeriod }
 */
export function getVacationWorkingYear(
  employee: EmployeeInput & { wasReset?: boolean },
  allRecords: VacationRecordInput[],
  targetRecord: VacationRecordInput | null
): WorkingYearResult | WorkingYearResult[] | null {
  if (!targetRecord || targetRecord.record_type !== 'period') return null

  const MAX_PER_YEAR = 24

  // For reset employees working years start from 2026-01-01; otherwise from hire date
  const hireDateStr = employee.wasReset ? '2026-01-01' : (employee.hire_date || '2026-01-01')
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

  // All period records for this employee sorted chronologically
  const periods = allRecords
    .filter(r => r.record_type === 'period' && r.start_date)
    .sort((a, b) =>
      (a.start_date! < b.start_date! ? -1 : a.start_date! > b.start_date! ? 1 : 0)
    )

  const fmt = (d: Date) =>
    d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })

  let result: WorkingYearResult | WorkingYearResult[] | null = null

  for (const record of periods) {
    let remaining = record.days_count || 0
    const splits: WorkingYearResult[] = []

    // FIFO: deduct from oldest non-exhausted working year first
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

/**
 * Formats a date string for display in Ukrainian locale.
 */
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
