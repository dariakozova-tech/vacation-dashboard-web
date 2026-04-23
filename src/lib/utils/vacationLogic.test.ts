import {
  calculateEarnedDays,
  calculateUsedDays,
  calculateEmployeeBalance,
  calculatePeriodDays,
  calculateForecastDays,
  getVacationWorkingYear,
  getAnnualBaseDays,
  getUBDEntitlement,
  getUBDUsed,
  getSocialEntitlementForYear,
  getTotalSocialEarned,
  getSocialUsed,
  yearWhenQualifyingEventOccurred,
  isSingleParentForPoolC,
  formatDate,
  RESET_DATE,
  DAYS_PER_MONTH,
  SYSTEM_START_YEAR,
} from './vacationLogic';

describe('constants', () => {
  it('RESET_DATE is 2026-01-01', () => {
    expect(RESET_DATE).toEqual(new Date('2026-01-01T00:00:00'));
  });
  it('DAYS_PER_MONTH is 2', () => {
    expect(DAYS_PER_MONTH).toBe(2);
  });
  it('SYSTEM_START_YEAR is 2023', () => {
    expect(SYSTEM_START_YEAR).toBe(2023);
  });
});

// ── Pool A: getAnnualBaseDays ───────────────────────────────────────────────

describe('getAnnualBaseDays', () => {
  it('returns 24 when no disability', () => {
    expect(getAnnualBaseDays([])).toBe(24);
    expect(getAnnualBaseDays([{ category: 'combat_veteran' }])).toBe(24);
  });
  it('returns 30 for disability_1', () => {
    expect(getAnnualBaseDays([{ category: 'disability_1' }])).toBe(30);
  });
  it('returns 30 for disability_2', () => {
    expect(getAnnualBaseDays([{ category: 'disability_2' }])).toBe(30);
  });
  it('returns 26 for disability_3', () => {
    expect(getAnnualBaseDays([{ category: 'disability_3' }])).toBe(26);
  });
  it('disability_1 takes priority over disability_3', () => {
    expect(getAnnualBaseDays([{ category: 'disability_1' }, { category: 'disability_3' }])).toBe(30);
  });
});

// ── Pool A: calculateEarnedDays ─────────────────────────────────────────────

describe('calculateEarnedDays', () => {
  it('returns >= 10 for 2021-07-01 to 2026-03-12', () => {
    expect(calculateEarnedDays('2021-07-01', new Date('2026-03-12'))).toBeGreaterThanOrEqual(10);
  });
  it('returns >= 0 for same start and end', () => {
    expect(calculateEarnedDays('2025-01-01', new Date('2025-01-01'))).toBeGreaterThanOrEqual(0);
  });
  it('uses custom annualBaseDays', () => {
    const with24 = calculateEarnedDays('2025-01-01', new Date('2026-01-01'), 24);
    const with30 = calculateEarnedDays('2025-01-01', new Date('2026-01-01'), 30);
    expect(with30).toBeGreaterThan(with24);
  });
});

// ── Pool A: calculateUsedDays ───────────────────────────────────────────────

describe('calculateUsedDays', () => {
  it('returns 0 for empty records', () => {
    expect(calculateUsedDays([], new Date(2024, 0, 1), new Date(2025, 0, 1))).toBe(0);
  });
  it('skips balance_reset records', () => {
    const records = [{ record_type: 'balance_reset' as const, days_count: 5 }];
    expect(calculateUsedDays(records, new Date(2026, 0, 1), new Date(2027, 0, 1))).toBe(0);
  });
  it('skips ubd vacation type', () => {
    const records = [{ record_type: 'period' as const, vacation_type: 'ubd', start_date: '2026-03-01', days_count: 14 }];
    expect(calculateUsedDays(records, new Date(2026, 0, 1), new Date(2027, 0, 1))).toBe(0);
  });
  it('skips social vacation type', () => {
    const records = [{ record_type: 'period' as const, vacation_type: 'social', start_date: '2026-03-01', days_count: 10 }];
    expect(calculateUsedDays(records, new Date(2026, 0, 1), new Date(2027, 0, 1))).toBe(0);
  });
  it('counts main vacation type', () => {
    const records = [{ record_type: 'period' as const, vacation_type: 'main', start_date: '2026-03-01', days_count: 7 }];
    expect(calculateUsedDays(records, new Date(2026, 0, 1), new Date(2027, 0, 1))).toBe(7);
  });
  it('counts days_sum records within window', () => {
    const records = [{ record_type: 'days_sum' as const, year: 2024, days_count: 14 }];
    expect(calculateUsedDays(records, new Date(2024, 0, 1), new Date(2025, 0, 1))).toBe(14);
  });
});

// ── Pool B: UBD ─────────────────────────────────────────────────────────────

describe('Pool B — UBD', () => {
  it('getUBDEntitlement returns 14 for combat veteran', () => {
    expect(getUBDEntitlement([{ category: 'combat_veteran' }])).toBe(14);
  });
  it('getUBDEntitlement returns 0 for non-veteran', () => {
    expect(getUBDEntitlement([])).toBe(0);
    expect(getUBDEntitlement([{ category: 'disability_2' }])).toBe(0);
  });
  it('getUBDUsed counts ubd records for given year', () => {
    const records = [
      { id: 1, record_type: 'period' as const, vacation_type: 'ubd', start_date: '2026-03-01', days_count: 7 },
      { id: 2, record_type: 'period' as const, vacation_type: 'ubd', start_date: '2025-06-01', days_count: 5 },
    ];
    expect(getUBDUsed(records, 2026)).toBe(7);
    expect(getUBDUsed(records, 2025)).toBe(5);
  });
  it('UBD does not accumulate across years', () => {
    // Used 0 in 2025, then new year → still only 14 for 2026, not 28
    const cats = [{ category: 'combat_veteran' }];
    const emp = { hire_date: '2022-01-01' };
    const result = calculateEmployeeBalance(emp, [], cats, [], new Date('2026-06-01'));
    expect(result.ubdBalance.entitled).toBe(14);
    expect(result.ubdBalance.remaining).toBe(14);
  });
});

// ── Pool C: Social ──────────────────────────────────────────────────────────

describe('Pool C — Social vacation', () => {
  describe('isSingleParentForPoolC', () => {
    it('returns true if any child has is_raised_alone', () => {
      const emp = { hire_date: '2020-01-01' };
      const children = [{ birth_date: '2015-01-01', is_raised_alone: true }];
      expect(isSingleParentForPoolC(emp, children)).toBe(true);
    });
    it('falls back to employee.is_single_parent', () => {
      const emp = { hire_date: '2020-01-01', is_single_parent: true };
      expect(isSingleParentForPoolC(emp, [{ birth_date: '2015-01-01' }])).toBe(true);
    });
    it('returns false when neither flag set', () => {
      expect(isSingleParentForPoolC({ hire_date: '2020-01-01' }, [{ birth_date: '2015-01-01' }])).toBe(false);
    });
  });

  describe('getSocialEntitlementForYear with is_raised_alone', () => {
    it('returns 10 for 1 child with is_raised_alone under 18', () => {
      const emp = { hire_date: '2020-01-01' };
      const children = [{ birth_date: '2012-01-01', is_raised_alone: true }];
      expect(getSocialEntitlementForYear(emp, children, 2026)).toBe(10);
    });
    it('returns 17 for 2 children with is_raised_alone under 18', () => {
      const emp = { hire_date: '2020-01-01' };
      const children = [
        { birth_date: '2012-01-01', is_raised_alone: true },
        { birth_date: '2015-01-01' },
      ];
      expect(getSocialEntitlementForYear(emp, children, 2026)).toBe(17);
    });
  });

  describe('yearWhenQualifyingEventOccurred', () => {
    it('returns single_parent_since year for single parent', () => {
      const emp = { hire_date: '2020-01-01', is_single_parent: true, single_parent_since: '2021-06-15' };
      expect(yearWhenQualifyingEventOccurred(emp, [])).toBe(2021);
    });
    it('returns second child birth year for non-single-parent', () => {
      const children = [{ birth_date: '2015-01-01' }, { birth_date: '2018-06-01' }];
      const emp = { hire_date: '2020-01-01' };
      expect(yearWhenQualifyingEventOccurred(emp, children)).toBe(2018);
    });
    it('returns 9999 when no qualifying event', () => {
      expect(yearWhenQualifyingEventOccurred({ hire_date: '2020-01-01' }, [])).toBe(9999);
    });
  });

  describe('getSocialEntitlementForYear', () => {
    it('returns 0 for no children, not single parent', () => {
      expect(getSocialEntitlementForYear({ hire_date: '2020-01-01' }, [], 2026)).toBe(0);
    });
    it('returns 0 for 1 child under 15, not single parent', () => {
      const children = [{ birth_date: '2015-06-01' }];
      expect(getSocialEntitlementForYear({ hire_date: '2020-01-01' }, children, 2026)).toBe(0);
    });
    it('returns 10 for 2 children under 15, not single parent', () => {
      const children = [{ birth_date: '2015-06-01' }, { birth_date: '2017-08-01' }];
      expect(getSocialEntitlementForYear({ hire_date: '2020-01-01' }, children, 2026)).toBe(10);
    });
    it('returns 10 for single parent with 1 child under 18', () => {
      const emp = { hire_date: '2020-01-01', is_single_parent: true };
      const children = [{ birth_date: '2012-01-01' }]; // age 14 in 2026
      expect(getSocialEntitlementForYear(emp, children, 2026)).toBe(10);
    });
    it('returns 17 for single parent with 2 children under 18', () => {
      const emp = { hire_date: '2020-01-01', is_single_parent: true };
      const children = [{ birth_date: '2012-01-01' }, { birth_date: '2015-01-01' }];
      expect(getSocialEntitlementForYear(emp, children, 2026)).toBe(17);
    });
    it('returns 0 when children are too old (under 15 cutoff)', () => {
      // Both children 15+ by Dec 31, 2026
      const children = [{ birth_date: '2010-01-01' }, { birth_date: '2011-01-01' }];
      expect(getSocialEntitlementForYear({ hire_date: '2020-01-01' }, children, 2026)).toBe(0);
    });
    it('single parent: 0 when child is 18+', () => {
      const emp = { hire_date: '2020-01-01', is_single_parent: true };
      const children = [{ birth_date: '2008-01-01' }]; // 18 in 2026
      expect(getSocialEntitlementForYear(emp, children, 2026)).toBe(0);
    });
  });

  describe('getTotalSocialEarned — accumulation', () => {
    it('accumulates 10 days/year for 2 children under 15', () => {
      const emp = { hire_date: '2023-01-01' };
      const children = [{ birth_date: '2015-01-01' }, { birth_date: '2017-01-01' }];
      // 2023, 2024, 2025, 2026 = 4 years × 10 = 40
      expect(getTotalSocialEarned(emp, children, 2026)).toBe(40);
    });
    it('accumulation starts from SYSTEM_START_YEAR even if hire is earlier', () => {
      const emp = { hire_date: '2020-01-01' };
      const children = [{ birth_date: '2015-01-01' }, { birth_date: '2017-01-01' }];
      // System starts 2023; qualifying year = 2017 (2nd child born)
      // So firstYear = max(2023, 2020, 2017) = 2023
      // 2023–2026 = 4 years × 10 = 40
      expect(getTotalSocialEarned(emp, children, 2026)).toBe(40);
    });
    it('starts from qualifying year if after SYSTEM_START_YEAR', () => {
      const emp = { hire_date: '2020-01-01' };
      // Second child born in 2025 → qualifying in 2025
      const children = [{ birth_date: '2015-01-01' }, { birth_date: '2025-06-01' }];
      // firstYear = max(2023, 2020, 2025) = 2025
      // 2025, 2026 = 2 years × 10 = 20
      expect(getTotalSocialEarned(emp, children, 2026)).toBe(20);
    });
    it('single parent accumulates 17 for 2+ children under 18', () => {
      const emp = { hire_date: '2023-01-01', is_single_parent: true, single_parent_since: '2023-01-01' };
      const children = [{ birth_date: '2012-01-01' }, { birth_date: '2015-01-01' }];
      // 2023–2026 = 4 years × 17 = 68
      expect(getTotalSocialEarned(emp, children, 2026)).toBe(68);
    });
  });

  describe('getSocialUsed', () => {
    it('counts all social records regardless of year', () => {
      const records = [
        { id: 1, record_type: 'period' as const, vacation_type: 'social', start_date: '2024-05-01', days_count: 10 },
        { id: 2, record_type: 'period' as const, vacation_type: 'social', start_date: '2025-05-01', days_count: 10 },
        { id: 3, record_type: 'period' as const, vacation_type: 'main', start_date: '2026-03-01', days_count: 7 },
      ];
      expect(getSocialUsed(records)).toBe(20);
    });
  });
});

// ── calculateEmployeeBalance — full integration ─────────────────────────────

describe('calculateEmployeeBalance', () => {
  const asOf = new Date('2026-04-01');

  it('returns correct shape for normal employee', () => {
    const result = calculateEmployeeBalance({ hire_date: '2022-01-01' }, [], [], [], asOf);
    expect(result.annualBaseDays).toBe(24);
    expect(typeof result.balance).toBe('number');
    expect(result.wasReset).toBe(false);
    expect(result.ubdBalance.entitled).toBe(0);
    expect(result.socialBalance.totalEarned).toBe(0);
  });

  it('Pool A: disability overrides annualBaseDays', () => {
    const cats = [{ category: 'disability_2', since: '2025-01-01' }];
    const result = calculateEmployeeBalance({ hire_date: '2022-01-01' }, [], cats, [], asOf);
    expect(result.annualBaseDays).toBe(30);
  });

  it('Pool B: combat veteran gets 14 days', () => {
    const cats = [{ category: 'combat_veteran', since: '2023-01-01' }];
    const result = calculateEmployeeBalance({ hire_date: '2022-01-01' }, [], cats, [], asOf);
    expect(result.ubdBalance.entitled).toBe(14);
    expect(result.ubdBalance.used).toBe(0);
    expect(result.ubdBalance.remaining).toBe(14);
  });

  it('Pool B: UBD used deducted correctly', () => {
    const cats = [{ category: 'combat_veteran', since: '2023-01-01' }];
    const records = [
      { id: 1, record_type: 'period' as const, vacation_type: 'ubd', start_date: '2026-03-01', days_count: 7 },
    ];
    const result = calculateEmployeeBalance({ hire_date: '2022-01-01' }, records, cats, [], asOf);
    expect(result.ubdBalance.used).toBe(7);
    expect(result.ubdBalance.remaining).toBe(7);
    // Pool A should NOT be affected
    expect(result.used2026).toBe(0);
  });

  it('Pool C: social balance accumulates', () => {
    const emp = { hire_date: '2023-08-01', is_single_parent: true, single_parent_since: '2023-08-01' };
    const children = [{ birth_date: '2015-01-01' }];
    // Single parent since Aug 2023; firstYear = max(2023, 2023, 2023) = 2023
    // 2023, 2024, 2025, 2026 = 4 years × 10 = 40
    const result = calculateEmployeeBalance(emp, [], [], children, asOf);
    expect(result.socialBalance.totalEarned).toBe(40);
    expect(result.socialBalance.used).toBe(0);
    expect(result.socialBalance.remaining).toBe(40);
  });

  it('Pool C: social used reduces remaining', () => {
    const emp = { hire_date: '2023-01-01', is_single_parent: true, single_parent_since: '2023-01-01' };
    const children = [{ birth_date: '2015-01-01' }];
    const records = [
      { id: 1, record_type: 'period' as const, vacation_type: 'social', start_date: '2024-06-01', days_count: 10 },
    ];
    const result = calculateEmployeeBalance(emp, records, [], children, asOf);
    expect(result.socialBalance.used).toBe(10);
    expect(result.socialBalance.remaining).toBe(result.socialBalance.totalEarned - 10);
    // Pool A should NOT be affected
    expect(result.used2026).toBe(0);
  });

  it('wasReset=true for employee with negative balance at reset', () => {
    const records = [
      { record_type: 'balance_reset' as const, days_count: 4 },
      { record_type: 'days_sum' as const, year: 2024, days_count: 60 },
      { record_type: 'days_sum' as const, year: 2025, days_count: 52 },
    ];
    const result = calculateEmployeeBalance({ hire_date: '2021-07-01' }, records, [], [], new Date('2026-03-12'));
    expect(result.wasReset).toBe(true);
    expect(result.balance).toBeGreaterThanOrEqual(0);
  });
});

// ── Utility functions ───────────────────────────────────────────────────────

describe('calculatePeriodDays', () => {
  it('returns 1 for same date', () => {
    expect(calculatePeriodDays('2026-01-01', '2026-01-01')).toBe(1);
  });
  it('returns 7 for a week', () => {
    expect(calculatePeriodDays('2026-03-01', '2026-03-07')).toBe(7);
  });
});

describe('calculateForecastDays', () => {
  it('returns non-negative number', () => {
    expect(calculateForecastDays({ hire_date: '2022-01-01' }, new Date('2026-03-12'))).toBeGreaterThanOrEqual(0);
  });
});

describe('getVacationWorkingYear', () => {
  it('returns null for non-period records', () => {
    const result = getVacationWorkingYear(
      { hire_date: '2022-01-01' },
      [],
      { id: 1, record_type: 'days_sum', year: 2024, days_count: 5 }
    );
    expect(result).toBeNull();
  });
  it('returns null for ubd records', () => {
    const result = getVacationWorkingYear(
      { hire_date: '2022-01-01' },
      [],
      { id: 1, record_type: 'period', vacation_type: 'ubd', start_date: '2026-03-01', days_count: 7 }
    );
    expect(result).toBeNull();
  });
  it('returns null if targetRecord is null', () => {
    expect(getVacationWorkingYear({ hire_date: '2022-01-01' }, [], null)).toBeNull();
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
    expect(result).not.toBe('—');
  });
});
