'use client';

import { useState, useMemo } from 'react';
import Tooltip from './Tooltip';
import { formatDate, getVacationWorkingYear, VacationRecordInput } from '@/lib/utils/vacationLogic';

interface EmployeeWithBalance {
  id: number;
  full_name: string;
  hire_date: string;
  email?: string | null;
  is_deel?: boolean;
  used2024: number;
  used2025: number;
  used2026: number;
  wasReset: boolean;
  resetDays: number;
  [key: string]: unknown;
}

interface EmployeeDetailProps {
  employee: EmployeeWithBalance;
  records: VacationRecordInput[];
}

// ── Working Year Badge ────────────────────────────────────────────────────────
function WorkingYearBadge({
  employee,
  records,
  record,
}: {
  employee: EmployeeWithBalance;
  records: VacationRecordInput[];
  record: VacationRecordInput;
}) {
  const info = getVacationWorkingYear(employee, records, record);
  if (!info) return null;

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    background: '#F5F5F7',
    color: '#6E6E73',
    borderRadius: 6,
    fontSize: 11,
    padding: '2px 8px',
    whiteSpace: 'nowrap',
    cursor: 'default',
    lineHeight: '18px',
    marginRight: 4,
  };

  if (Array.isArray(info)) {
    return (
      <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
        {info.map((item, i) => (
          <Tooltip
            key={i}
            text={`${item.daysTaken} дн. з Року ${item.yearNumber} · використано ${item.daysUsedInPeriod} з ${item.daysAvailableInPeriod}`}
          >
            <span style={badgeStyle}>
              Рік {item.yearNumber} · {item.periodStart} – {item.periodEnd} ({item.daysTaken} дн.)
            </span>
          </Tooltip>
        ))}
      </span>
    );
  }

  const badgeText = `Рік ${info.yearNumber} · ${info.periodStart} – ${info.periodEnd}`;
  const tooltipText = `Використано в цьому робочому році: ${info.daysUsedInPeriod} з ${info.daysAvailableInPeriod} днів`;

  return (
    <Tooltip text={tooltipText}>
      <span style={badgeStyle}>{badgeText}</span>
    </Tooltip>
  );
}

// ── Records Table (single year) ───────────────────────────────────────────────
function RecordsTable({
  records,
  employee,
  allRecords,
}: {
  records: VacationRecordInput[];
  employee: EmployeeWithBalance;
  allRecords: VacationRecordInput[];
}) {
  if (records.length === 0) {
    return <div className="detail-empty">Записів немає</div>;
  }

  return (
    <table className="detail-table">
      <thead>
        <tr>
          <th>Дата початку</th>
          <th>Дата кінця</th>
          <th>Днів</th>
          <th>Робочий рік</th>
          <th>Нотатка</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr key={record.id}>
            <td style={{ color: 'var(--text-primary)' }}>
              {record.start_date ? formatDate(record.start_date) : '—'}
            </td>
            <td style={{ color: 'var(--text-primary)' }}>
              {record.end_date ? formatDate(record.end_date) : '—'}
            </td>
            <td style={{ fontWeight: 600 }}>
              {record.days_count != null ? record.days_count : '—'}
            </td>
            <td>
              <WorkingYearBadge employee={employee} records={allRecords} record={record} />
            </td>
            <td
              style={{
                color: 'var(--text-secondary)',
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.note || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmployeeDetail({ employee, records }: EmployeeDetailProps) {
  const currentYear = new Date().getFullYear();

  const allPeriods = useMemo(
    () =>
      records
        .filter((r) => r.record_type === 'period' && r.start_date)
        .sort((a, b) => (a.start_date! < b.start_date! ? -1 : a.start_date! > b.start_date! ? 1 : 0)),
    [records]
  );

  const years = useMemo(() => {
    const yearSet = new Set(allPeriods.map((r) => parseInt(r.start_date!.slice(0, 4), 10)));
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [allPeriods]);

  const defaultTab = useMemo(() => {
    if (years.includes(currentYear)) return String(currentYear);
    return years.length > 0 ? String(years[years.length - 1]) : 'all';
  }, [years, currentYear]);

  const [activeTab, setActiveTab] = useState(defaultTab);

  const visibleRecords = useMemo(() => {
    if (activeTab === 'all') return allPeriods;
    return allPeriods.filter((r) => r.start_date!.startsWith(activeTab));
  }, [allPeriods, activeTab]);

  const yearTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const r of allPeriods) {
      const yr = r.start_date!.slice(0, 4);
      totals[yr] = (totals[yr] || 0) + (r.days_count || 0);
    }
    return totals;
  }, [allPeriods]);

  const tabStyle = (key: string): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 7,
    border: '1px solid',
    borderColor: activeTab === key ? 'var(--accent)' : 'var(--border)',
    background: activeTab === key ? 'var(--accent)' : 'transparent',
    color: activeTab === key ? '#fff' : 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: activeTab === key ? 600 : 400,
    cursor: 'pointer',
  });

  return (
    <div className="detail-panel-inner">
      {/* Email */}
      {employee.email && (
        <div style={{ marginBottom: 8 }}>
          <a
            href={`mailto:${employee.email}`}
            style={{ fontSize: 12, color: '#6E6E73', textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            {employee.email}
          </a>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div className="detail-title">Відпустки</div>
      </div>

      {allPeriods.length === 0 ? (
        <div className="detail-empty">Записів поки немає</div>
      ) : (
        <>
          {/* Year tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <button style={tabStyle('all')} onClick={() => setActiveTab('all')}>
              Всі
            </button>
            {years.map((yr) => (
              <button key={yr} style={tabStyle(String(yr))} onClick={() => setActiveTab(String(yr))}>
                {yr}
              </button>
            ))}
          </div>

          {/* "All" tab: grouped by year */}
          {activeTab === 'all' ? (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Дата початку</th>
                  <th>Дата кінця</th>
                  <th>Днів</th>
                  <th>Робочий рік</th>
                  <th>Нотатка</th>
                </tr>
              </thead>
              <tbody>
                {years.map((yr) => {
                  const yrStr = String(yr);
                  const yrRecords = allPeriods.filter((r) => r.start_date!.startsWith(yrStr));
                  if (yrRecords.length === 0) return null;
                  return (
                    <>
                      {/* Year separator */}
                      <tr key={`sep-${yr}`}>
                        <td
                          colSpan={5}
                          style={{
                            background: 'var(--bg-secondary, #F5F5F7)',
                            color: 'var(--text-secondary)',
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            padding: '5px 10px',
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          {yr}
                        </td>
                      </tr>
                      {yrRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.start_date ? formatDate(record.start_date) : '—'}</td>
                          <td>{record.end_date ? formatDate(record.end_date) : '—'}</td>
                          <td style={{ fontWeight: 600 }}>
                            {record.days_count != null ? record.days_count : '—'}
                          </td>
                          <td>
                            <WorkingYearBadge employee={employee} records={records} record={record} />
                          </td>
                          <td
                            style={{
                              color: 'var(--text-secondary)',
                              maxWidth: 180,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {record.note || '—'}
                          </td>
                        </tr>
                      ))}
                      {/* Year total footer */}
                      <tr key={`total-${yr}`}>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: 'right',
                            fontSize: 11,
                            color: 'var(--text-tertiary)',
                            padding: '4px 10px',
                            fontStyle: 'italic',
                          }}
                        >
                          Всього {yr}: {yearTotals[yrStr] || 0} дн.
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Single year tab */
            <RecordsTable
              records={visibleRecords}
              employee={employee}
              allRecords={records}
            />
          )}
        </>
      )}

      {/* Pre-2026 summary */}
      {(employee.used2024 > 0 || employee.used2025 > 0 || employee.wasReset) && (
        <div
          style={{
            marginTop: 16,
            padding: '10px 14px',
            background: 'rgba(0,0,0,0.03)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          {employee.used2024 > 0 && (
            <span>
              2024: <strong style={{ color: 'var(--text-primary)' }}>{employee.used2024} дн.</strong>
            </span>
          )}
          {employee.used2025 > 0 && (
            <span>
              2025: <strong style={{ color: 'var(--text-primary)' }}>{employee.used2025} дн.</strong>
            </span>
          )}
          {employee.wasReset && (
            <span
              style={{
                background: '#FF9500',
                color: '#fff',
                borderRadius: 6,
                fontSize: 11,
                padding: '2px 8px',
                fontWeight: 500,
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              Обнулення 01.01.2026 — від&apos;ємний баланс списано
            </span>
          )}
        </div>
      )}
    </div>
  );
}
