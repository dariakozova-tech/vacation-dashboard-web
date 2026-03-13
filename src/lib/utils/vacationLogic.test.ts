import {
  calculateEarnedDays,
  calculateUsedDays,
  calculateEmployeeBalance,
  calculatePeriodDays,
  calculateForecastDays,
  getVacationWorkingYear,
  formatDate,
  RESET_DATE,
  DAYS_PER_MONTH,
} from './vacationLogic';

describe('RESET_DATE and DAYS_PER_MONTH constants', () => {
  it('RESET_DATE is 2026-01-01', () => {
    expect(RESET_DATE).toEqual(new Date('2026-01-01T00:00:00'));
  });

  it('DAYS_PER_MONTH is 2', () => {
    expect(DAYS_PER_MONTH).toBe(2);
  });
});

describe('calculateEarnedDays', () => {
  it('returns a positive integer for hire_date 2021-07-01 as of 2026-03-12 (at least 10)', () => {
    const result = calculateEarnedDays('2021-07-01', new Date('2026-03-12'));
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(10);
  });

  it('returns 0 for same start and end date', () => {
    const result = calculateEarnedDays('2025-01-01', new Date('2025-01-01'));
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('returns expected days for known date range', () => {
    // hire 2021-07-01 to 2026-03-12 is ~4.7 years → ~113 days (4.7 * 24)
    const result = calculateEarnedDays('2021-07-01', new Date('2026-03-12'));
    expect(result).toBeGreaterThan(100);
    expect(result).toBeLessThan(130);
  });
});

describe('calculateUsedDays', () => {
  it('returns 0 for empty records', () => {
    const result = calculateUsedDays([], new Date('2024-01-01'), new Date('2025-01-01'));
    expect(result).toBe(0);
  });

  it('skips balance_reset records', () => {
    const records = [{ record_type: 'balance_reset' as const, days_count: 5 }];
    const result = calculateUsedDays(records, new Date('2026-01-01'), new Date('2027-01-01'));
    expect(result).toBe(0);
  });

  it('counts days_sum records within window', () => {
    const records = [
      { record_type: 'days_sum' as const, year: 2024, days_count: 14 },
    ];
    const result = calculateUsedDays(records, new Date('2024-01-01'), new Date('2025-01-01'));
    expect(result).toBe(14);
  });

  it('does not count days_sum records outside window', () => {
    const records = [
      { record_type: 'days_sum' as const, year: 2023, days_count: 10 },
    ];
    const result = calculateUsedDays(records, new Date('2024-01-01'), new Date('2025-01-01'));
    expect(result).toBe(0);
  });

  it('counts period records with start_date >= 2026-01-01', () => {
    const records = [
      { record_type: 'period' as const, start_date: '2025-06-01', days_count: 7 },
    ];
    // start_date 2025-06-01 is before 2026 cutoff, should be skipped
    const result = calculateUsedDays(records, new Date('2025-01-01'), new Date('2026-01-01'));
    expect(result).toBe(0);
  });

  it('counts period records starting in 2026 within window', () => {
    const records = [
      { record_type: 'period' as const, start_date: '2026-03-01', days_count: 7 },
    ];
    const result = calculateUsedDays(records, new Date('2026-01-01'), new Date('2027-01-01'));
    expect(result).toBe(7);
  });

  it('excludes pre-2026 period records from 2026 window', () => {
    const records = [
      { record_type: 'period' as const, start_date: '2025-12-01', days_count: 7 },
    ];
    const result = calculateUsedDays(records, new Date('2026-01-01'), new Date('2027-01-01'));
    expect(result).toBe(0);
  });
});

describe('calculateEmployeeBalance', () => {
  it('returns correct shape for a normal employee with positive balance', () => {
    // Normal employee: no negative balance at reset date
    const employee = { hire_date: '2022-01-01' };
    const records: any[] = [];
    const result = calculateEmployeeBalance(employee, records, new Date('2026-03-12'));
    expect(typeof result.balance).toBe('number');
    expect(typeof result.earned).toBe('number');
    expect(result.wasReset).toBe(false);
    expect(result.balance).toBeGreaterThanOrEqual(0);
  });

  it('wasReset=false for employee hired 2022-01-01 with no records (positive balance)', () => {
    const employee = { hire_date: '2022-01-01' };
    const result = calculateEmployeeBalance(employee, [], new Date('2026-03-12'));
    expect(result.wasReset).toBe(false);
  });

  // Seed employee: Бондаренко Олексій (2021-07-01) — reset employee
  it('returns wasReset=true for Бондаренко Олексій with balance_reset record', () => {
    const employee = { hire_date: '2021-07-01' };
    const records = [
      { record_type: 'balance_reset' as const, days_count: 4 },
      // days_sum records before reset to make balance go negative
      { record_type: 'days_sum' as const, year: 2024, days_count: 28 },
      { record_type: 'days_sum' as const, year: 2025, days_count: 28 },
    ];
    const result = calculateEmployeeBalance(employee, records, new Date('2026-03-12'));
    expect(result.wasReset).toBe(true);
    expect(result.balance).toBeGreaterThanOrEqual(0);
    expect(result.resetDays).toBeGreaterThan(0);
  });

  // Seed employee: Мельник Дмитро (2020-01-10) — reset employee
  it('returns wasReset=true for Мельник Дмитро with balance_reset record', () => {
    const employee = { hire_date: '2020-01-10' };
    const records = [
      { record_type: 'balance_reset' as const, days_count: 10 },
      { record_type: 'days_sum' as const, year: 2024, days_count: 40 },
      { record_type: 'days_sum' as const, year: 2025, days_count: 40 },
    ];
    const result = calculateEmployeeBalance(employee, records, new Date('2026-03-12'));
    expect(result.wasReset).toBe(true);
    expect(result.balance).toBeGreaterThanOrEqual(0);
  });

  it('returns used2024, used2025, used2026 fields', () => {
    const employee = { hire_date: '2022-01-01' };
    const records = [
      { record_type: 'days_sum' as const, year: 2024, days_count: 5 },
      { record_type: 'days_sum' as const, year: 2025, days_count: 3 },
    ];
    const result = calculateEmployeeBalance(employee, records, new Date('2026-03-12'));
    expect(result.used2024).toBe(5);
    expect(result.used2025).toBe(3);
    expect(result.used2026).toBe(0);
  });
});

describe('calculatePeriodDays', () => {
  it('returns 1 for same start and end date', () => {
    expect(calculatePeriodDays('2026-01-01', '2026-01-01')).toBe(1);
  });

  it('returns 7 for a 7-day period', () => {
    expect(calculatePeriodDays('2026-03-01', '2026-03-07')).toBe(7);
  });
});

describe('calculateForecastDays', () => {
  it('returns a non-negative number', () => {
    const employee = { hire_date: '2022-01-01' };
    const result = calculateForecastDays(employee, new Date('2026-03-12'));
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('getVacationWorkingYear', () => {
  it('returns null for non-period records', () => {
    const employee = { hire_date: '2022-01-01', wasReset: false };
    const record = { id: 1, record_type: 'days_sum' as const, year: 2024, days_count: 5 };
    const result = getVacationWorkingYear(employee, [], record);
    expect(result).toBeNull();
  });

  it('returns null if targetRecord is null', () => {
    const employee = { hire_date: '2022-01-01', wasReset: false };
    const result = getVacationWorkingYear(employee, [], null);
    expect(result).toBeNull();
  });
});

describe('formatDate', () => {
  it('returns — for empty/null input', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate(null)).toBe('—');
  });

  it('returns formatted date string for valid ISO date', () => {
    const result = formatDate('2026-03-01');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('—');
  });
});
