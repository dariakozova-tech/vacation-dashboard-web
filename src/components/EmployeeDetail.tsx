'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
  earned: number;
  balance: number;
  annualBaseDays?: number;
  ubdBalance?: { year: number; entitled: number; used: number; remaining: number };
  socialBalance?: { totalEarned: number; used: number; remaining: number; currentYearEntitlement: number };
  categories?: any[];
  children?: any[];
  [key: string]: unknown;
}

interface EmployeeDetailProps {
  employee: EmployeeWithBalance;
  records: VacationRecordInput[];
  onAddVacation?: () => void;
  onEditVacation?: (record: VacationRecordInput) => void;
  onDeleteVacation?: (recordId: number) => void;
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

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ record }: { record: VacationRecordInput }) {
  const status = (record as any).status as string | undefined;
  if (!status || status === 'approved') return null;

  if (status === 'pending') {
    return (
      <span style={{
        display: 'inline-block',
        background: '#FFF3E0',
        color: '#E65100',
        borderRadius: 6,
        fontSize: 10,
        padding: '1px 6px',
        fontWeight: 500,
        marginLeft: 4,
      }}>
        На розгляді
      </span>
    );
  }

  if (status === 'declined') {
    return (
      <span style={{
        display: 'inline-block',
        background: '#FFEBEE',
        color: '#C62828',
        borderRadius: 6,
        fontSize: 10,
        padding: '1px 6px',
        fontWeight: 500,
        marginLeft: 4,
      }}>
        Відхилено
      </span>
    );
  }

  return null;
}

// ── Records Table (single year) ───────────────────────────────────────────────
function RecordsTable({
  records,
  employee,
  allRecords,
  onEditVacation,
  onDeleteVacation,
}: {
  records: VacationRecordInput[];
  employee: EmployeeWithBalance;
  allRecords: VacationRecordInput[];
  onEditVacation?: (record: VacationRecordInput) => void;
  onDeleteVacation?: (recordId: number) => void;
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
          <th>Вчасно</th>
          <th style={{ width: 70 }}></th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          record.record_type === 'days_sum' ? (
            <tr key={`ds-${record.id}`} style={{ background: '#F5F5F7' }}>
              <td colSpan={3} style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 12 }}>
                Архівний підсумок {record.year}: <strong>{record.days_count} дн.</strong>
              </td>
              <td style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', fontSize: 11 }}>
                {record.vacation_type && record.vacation_type !== 'main' ? record.vacation_type.toUpperCase() : ''}
              </td>
              <td style={{ color: 'var(--text-tertiary)', fontSize: 11, fontStyle: 'italic' }}>{record.note || '—'}</td>
              <td>—</td>
              <td>
                <div className="row-actions">
                  <button className="btn btn-icon" onClick={() => onEditVacation?.(record)}><Pencil size={13} /></button>
                  <button className="btn btn-icon btn-danger" onClick={() => record.id != null && onDeleteVacation?.(record.id)}><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>
          ) : (
          <tr key={record.id} style={(record as any).status === 'pending' ? { opacity: 0.7 } : (record as any).status === 'declined' ? { opacity: 0.5, textDecoration: 'line-through' } : undefined}>
            <td style={{ color: 'var(--text-primary)' }}>
              {record.start_date ? formatDate(record.start_date) : '—'}
            </td>
            <td style={{ color: 'var(--text-primary)' }}>
              {record.end_date ? formatDate(record.end_date) : '—'}
            </td>
            <td style={{ fontWeight: 600 }}>
              {record.days_count != null ? record.days_count : '—'}
              <StatusBadge record={record} />
            </td>
            <td>
              {record.vacation_type === 'ubd' ? (
                <span className="balance-chip" style={{ background: '#E8DEF8', color: '#4A4458' }}>УБД</span>
              ) : record.vacation_type === 'social' ? (
                <span className="balance-chip" style={{ background: '#C2E7FF', color: '#004A77' }}>На дітей</span>
              ) : (
                <WorkingYearBadge employee={employee} records={allRecords} record={record} />
              )}
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
            <td style={{ textAlign: 'center' }}>
              {record.record_type === 'period' ? (
                <button
                  type="button"
                  className="btn btn-icon"
                  style={{ background: 'transparent', cursor: 'grab' }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!record.id) return;
                    const { toggleSubmittedOnTimeAction } = await import('@/lib/actions/vacationRecords');
                    await toggleSubmittedOnTimeAction(record.id, record.submitted_on_time ?? true);
                  }}
                  title="Документи подано вчасно"
                >
                  {record.submitted_on_time ? '✅' : '❌'}
                </button>
              ) : '—'}
            </td>
            <td>
              <div className="row-actions">
                <button className="btn btn-icon" onClick={() => onEditVacation?.(record)}>
                  <Pencil size={13} />
                </button>
                <button className="btn btn-icon btn-danger" onClick={() => record.id != null && onDeleteVacation?.(record.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </td>
          </tr>
          )
        ))}
      </tbody>
    </table>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmployeeDetail({
  employee,
  records,
  onAddVacation,
  onEditVacation,
  onDeleteVacation,
}: EmployeeDetailProps) {
  const currentYear = new Date().getFullYear();

  // days_sum archive records (displayed separately per year)
  const daysSumRecords = useMemo(
    () => records.filter((r) => r.record_type === 'days_sum' && r.year),
    [records]
  );

  const allPeriods = useMemo(
    () =>
      records
        .filter((r) => r.record_type === 'period' && r.start_date)
        .sort((a, b) => (a.start_date! < b.start_date! ? -1 : a.start_date! > b.start_date! ? 1 : 0)),
    [records]
  );

  const years = useMemo(() => {
    const yearSet = new Set([
      ...allPeriods.map((r) => parseInt(r.start_date!.slice(0, 4), 10)),
      ...daysSumRecords.map((r) => r.year!),
    ]);
    return Array.from(yearSet).sort((a, b) => a - b);
  }, [allPeriods, daysSumRecords]);

  const defaultTab = useMemo(() => {
    if (years.includes(currentYear)) return String(currentYear);
    return years.length > 0 ? String(years[years.length - 1]) : 'all';
  }, [years, currentYear]);

  const [activeTab, setActiveTab] = useState(defaultTab);

  const visibleRecords = useMemo(() => {
    if (activeTab === 'all') return [...daysSumRecords, ...allPeriods];
    const yrDaysSum = daysSumRecords.filter((r) => String(r.year) === activeTab);
    const yrPeriods = allPeriods.filter((r) => r.start_date!.startsWith(activeTab));
    return [...yrDaysSum, ...yrPeriods];
  }, [allPeriods, daysSumRecords, activeTab]);

  const yearTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const r of allPeriods) {
      const yr = r.start_date!.slice(0, 4);
      totals[yr] = (totals[yr] || 0) + (r.days_count || 0);
    }
    for (const r of daysSumRecords) {
      const yr = String(r.year);
      totals[yr] = (totals[yr] || 0) + (r.days_count || 0);
    }
    return totals;
  }, [allPeriods, daysSumRecords]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="detail-title">Відпустки</div>
        {onAddVacation && (
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12 }}
            onClick={onAddVacation}
          >
            <Plus size={13} /> Додати
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {/* Щорічна основна відпустка */}
        <div style={{ padding: '12px 14px', background: '#F5F5F7', borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Щорічна основна відпустка</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr', gap: '4px 12px' }}>
            <span>Норма: <strong style={{ color: 'var(--text-primary)' }}>{employee.annualBaseDays || 24} дн./рік</strong>
              {(employee.annualBaseDays === 30) && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}> (інвалідність I/II)</span>}
              {(employee.annualBaseDays === 26) && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}> (інвалідність III)</span>}
            </span>
            <span>Зароблено: <strong style={{ color: 'var(--text-primary)' }}>{employee.earned} дн.</strong></span>
            <span>Залишок: <strong style={{ color: employee.balance < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{employee.balance} дн.</strong>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}> (накопичується)</span>
            </span>
          </div>
        </div>

        {/* Додаткова відпустка УБД */}
        {employee.ubdBalance && employee.ubdBalance.entitled > 0 && (
          <div style={{ padding: '12px 14px', background: '#FDF7EE', borderRadius: 10, border: '1px solid #F3E0C5' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#B06500', marginBottom: 6 }}>Додаткова відпустка УБД ({currentYear})</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr', gap: '4px 12px' }}>
              <span>Нараховано: <strong style={{ color: 'var(--text-primary)' }}>{employee.ubdBalance.entitled} дн.</strong></span>
              <span>Використано: <strong style={{ color: 'var(--text-primary)' }}>{employee.ubdBalance.used} дн.</strong></span>
              <span>Залишок: <strong style={{ color: 'var(--text-primary)' }}>{employee.ubdBalance.remaining} дн.</strong></span>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#A36814' }}>
              ⚠️ Згорає 31.12.{currentYear}, не переноситься
            </div>
          </div>
        )}

        {/* Соціальна відпустка на дітей */}
        {employee.socialBalance && (employee.socialBalance.totalEarned > 0 || (employee.children && employee.children.length > 0)) && (
          <div style={{ padding: '12px 14px', background: '#F0F9FF', borderRadius: 10, border: '1px solid #BEE3F8' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0969DA', marginBottom: 6 }}>Соціальна відпустка (діти)</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr', gap: '4px 12px' }}>
              <span>Накопичено: <strong style={{ color: 'var(--text-primary)' }}>{employee.socialBalance.totalEarned} дн.</strong></span>
              <span>Використано: <strong style={{ color: 'var(--text-primary)' }}>{employee.socialBalance.used} дн.</strong></span>
              <span>Залишок: <strong style={{ color: 'var(--text-primary)' }}>{employee.socialBalance.remaining} дн.</strong></span>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#2C73B3' }}>
              {employee.socialBalance!.totalEarned > 0
                ? 'Не згорає — накопичується щорічно'
                : 'Уточніть дати народження для розрахунку'}
            </div>
          </div>
        )}
      </div>

      {allPeriods.length === 0 && daysSumRecords.length === 0 ? (
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
                  <th>Вчасно</th>
                  <th style={{ width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {years.map((yr) => {
                  const yrStr = String(yr);
                  const yrRecords = allPeriods.filter((r) => r.start_date!.startsWith(yrStr));
                  const yrDaysSum = daysSumRecords.filter((r) => r.year === yr);
                  if (yrRecords.length === 0 && yrDaysSum.length === 0) return null;
                  return (
                    <React.Fragment key={yr}>
                      {/* Year separator */}
                      <tr>
                        <td
                          colSpan={6}
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
                      {yrDaysSum.map((ds) => (
                        <tr key={`ds-${ds.id}`} style={{ background: '#F5F5F7' }}>
                          <td colSpan={3} style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 12 }}>
                            Архівний підсумок {yr}: <strong>{ds.days_count} дн.</strong>
                          </td>
                          <td style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', fontSize: 11 }}>
                            {ds.vacation_type && ds.vacation_type !== 'main' ? ds.vacation_type.toUpperCase() : ''}
                          </td>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: 11, fontStyle: 'italic' }}>{ds.note || '—'}</td>
                          <td>—</td>
                          <td>
                            <div className="row-actions">
                              <button className="btn btn-icon" onClick={() => onEditVacation?.(ds)}><Pencil size={13} /></button>
                              <button className="btn btn-icon btn-danger" onClick={() => ds.id != null && onDeleteVacation?.(ds.id)}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {yrRecords.map((record) => (
                        <tr key={record.id} style={(record as any).status === 'pending' ? { opacity: 0.7 } : (record as any).status === 'declined' ? { opacity: 0.5, textDecoration: 'line-through' } : undefined}>
                          <td>{record.start_date ? formatDate(record.start_date) : '—'}</td>
                          <td>{record.end_date ? formatDate(record.end_date) : '—'}</td>
                          <td style={{ fontWeight: 600 }}>
                            {record.days_count != null ? record.days_count : '—'}
                            <StatusBadge record={record} />
                          </td>
                          <td>
                            {record.vacation_type === 'ubd' ? (
                              <span className="balance-chip" style={{ background: '#E8DEF8', color: '#4A4458' }}>УБД</span>
                            ) : record.vacation_type === 'social' ? (
                              <span className="balance-chip" style={{ background: '#C2E7FF', color: '#004A77' }}>На дітей</span>
                            ) : (
                              <WorkingYearBadge employee={employee} records={records} record={record} />
                            )}
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
                          <td style={{ textAlign: 'center' }}>
                            {record.record_type === 'period' ? (
                              <button
                                type="button"
                                className="btn btn-icon"
                                style={{ background: 'transparent', cursor: 'pointer' }}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!record.id) return;
                                  const { toggleSubmittedOnTimeAction } = await import('@/lib/actions/vacationRecords');
                                  await toggleSubmittedOnTimeAction(record.id, record.submitted_on_time ?? true);
                                }}
                                title="Документи подано вчасно"
                              >
                                {record.submitted_on_time ? '✅' : '❌'}
                              </button>
                            ) : '—'}
                          </td>
                          <td>
                            <div className="row-actions">
                              <button className="btn btn-icon" onClick={() => onEditVacation?.(record)}>
                                <Pencil size={13} />
                              </button>
                              <button className="btn btn-icon btn-danger" onClick={() => record.id != null && onDeleteVacation?.(record.id)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {/* Year total footer */}
                      <tr>
                        <td
                          colSpan={6}
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
                    </React.Fragment>
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
              onEditVacation={onEditVacation}
              onDeleteVacation={onDeleteVacation}
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
