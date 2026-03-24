'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip as ReTooltip, Legend,
  ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  calculateEarnedDays,
  calculateUsedDays,
  calculateEmployeeBalance,
  RESET_DATE,
} from '@/lib/utils/vacationLogic';

const MONTHS_UK = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];

const COLORS = {
  accent: '#0071E3',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  purple: '#5856D6',
  teal: '#32ADE6',
};

function KpiCard({ label, value, sub, valueClass }: {
  label: string;
  value: string | number;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${valueClass || ''}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

const customTooltipStyle = {
  background: 'rgba(29,29,31,0.88)',
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  fontSize: 12,
  padding: '8px 12px',
};

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ fill?: string; color?: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={customTooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.color }}>
          {p.name}: {p.value} дн.
        </div>
      ))}
    </div>
  );
}

const SEGMENT_OPTIONS = [
  { key: 'all',  label: 'Всі' },
  { key: 'tov',  label: 'ТОВ' },
  { key: 'deel', label: 'Deel' },
];

interface AnalyticsTabProps {
  employees: any[];
  allRecords: any[];
}

export default function AnalyticsTab({ employees, allRecords }: AnalyticsTabProps) {
  const today = new Date();
  const currentYear = today.getFullYear();

  // ── Group filter ────────────────────────────────────────────────────────────
  const [groupFilter, setGroupFilter] = useState('all');

  const filteredEmployees = useMemo(() => {
    if (groupFilter === 'tov')  return employees.filter((e: any) => !e.is_deel);
    if (groupFilter === 'deel') return employees.filter((e: any) => e.is_deel);
    return employees;
  }, [employees, groupFilter]);

  // ── Forecast date picker ────────────────────────────────────────────────────
  const [forecastDateStr, setForecastDateStr] = useState(`${currentYear}-12-31`);
  const forecastDate = useMemo(() => {
    const d = new Date(forecastDateStr);
    return isNaN(d.getTime()) ? new Date(currentYear, 11, 31) : d;
  }, [forecastDateStr, currentYear]);

  // ── KPI calculations ───────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const posBalances = filteredEmployees.filter((e: any) => e.balance > 0).map((e: any) => e.balance);
    const totalUnused = posBalances.reduce((s: number, b: number) => s + b, 0);
    const avgBalance = filteredEmployees.length
      ? filteredEmployees.reduce((s: number, e: any) => s + e.balance, 0) / filteredEmployees.length
      : 0;
    const negCount = filteredEmployees.filter((e: any) => e.balance < 0).length;
    const noVacation2026 = filteredEmployees.filter((e: any) => !e.used2026 || e.used2026 === 0).length;
    const pctNoVac = filteredEmployees.length ? Math.round((noVacation2026 / filteredEmployees.length) * 100) : 0;

    return { totalUnused, avgBalance: Math.round(avgBalance * 10) / 10, negCount, pctNoVac, noVacation2026 };
  }, [filteredEmployees]);

  // ── Monthly usage (current year, from period records) ─────────────────────
  const monthlyData = useMemo(() => {
    const months = MONTHS_UK.map(m => ({ month: m, days: 0 }));
    const filteredIds = new Set(filteredEmployees.map((e: any) => e.id));
    allRecords.forEach((r: any) => {
      if (!filteredIds.has(r.employee_id)) return;
      if (r.record_type === 'period' && r.start_date?.startsWith(`${currentYear}`)) {
        const month = parseInt(r.start_date.slice(5, 7), 10) - 1;
        if (month >= 0 && month < 12) {
          months[month].days += r.days_count || 0;
        }
      }
      if (r.record_type === 'days_sum' && r.year === currentYear) {
        months[0].days += r.days_count || 0;
      }
    });
    return months;
  }, [allRecords, filteredEmployees, currentYear]);

  // ── Year comparison (company totals) ─────────────────────────────────────
  const yearCompare = useMemo(() => {
    return [
      {
        year: '2024',
        days: filteredEmployees.reduce((s: number, e: any) => s + (e.used2024 || 0), 0),
      },
      {
        year: '2025',
        days: filteredEmployees.reduce((s: number, e: any) => s + (e.used2025 || 0), 0),
      },
      {
        year: String(currentYear),
        days: filteredEmployees.reduce((s: number, e: any) => s + (e.used2026 || 0), 0),
      },
    ];
  }, [filteredEmployees, currentYear]);

  // ── Top 10 by balance ─────────────────────────────────────────────────────
  const top10 = useMemo(() => {
    return [...filteredEmployees]
      .sort((a: any, b: any) => b.balance - a.balance)
      .slice(0, 10)
      .map((e: any) => ({
        name: e.full_name.split(' ').slice(0, 2).join(' '),
        balance: e.balance,
        fill: e.balance < 0 ? COLORS.danger : e.balance < 3 ? COLORS.warning : COLORS.accent,
      }));
  }, [filteredEmployees]);

  // ── Line chart: earned vs used per month ──────────────────────────────────
  const lineData = useMemo(() => {
    const filteredIds = new Set(filteredEmployees.map((e: any) => e.id));
    return MONTHS_UK.slice(0, today.getMonth() + 1).map((m, i) => {
      const monthEnd = new Date(currentYear, i + 1, 0, 23, 59, 59);
      const earned = calculateEarnedDays(RESET_DATE, monthEnd);

      const yearStart = new Date(currentYear, 0, 1);
      const monthEndForUsed = new Date(currentYear, i + 1, 1);
      const filteredRecords = allRecords.filter((r: any) => filteredIds.has(r.employee_id));
      const used = calculateUsedDays(filteredRecords, yearStart, monthEndForUsed);

      return { month: m, earned, used };
    });
  }, [allRecords, filteredEmployees, today, currentYear]);

  // ── Forecast table ─────────────────────────────────────────────────────────
  const forecastData = useMemo(() => {
    return filteredEmployees.map((emp: any) => {
      const balanceAtDate = calculateEmployeeBalance(emp, emp.records || [], forecastDate);
      const usedTotal = balanceAtDate.used2024 + balanceAtDate.used2025 + balanceAtDate.used2026;
      return {
        id: emp.id,
        full_name: emp.full_name,
        earned: balanceAtDate.earned,
        usedTotal,
        projectedBalance: balanceAtDate.balance,
      };
    }).sort((a: any, b: any) => b.projectedBalance - a.projectedBalance);
  }, [filteredEmployees, forecastDate]);

  const forecastLabel = forecastDate.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div>
      {/* Segmented group filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {SEGMENT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setGroupFilter(opt.key)}
            style={{
              padding: '5px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: groupFilter === opt.key ? 'var(--accent)' : 'var(--border)',
              background: groupFilter === opt.key ? 'var(--accent)' : 'transparent',
              color: groupFilter === opt.key ? '#fff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: groupFilter === opt.key ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
          {filteredEmployees.length} осіб
        </span>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Загальний залишок"
          value={`${kpi.totalUnused} дн.`}
          sub="Сума позитивних балансів"
          valueClass="accent"
        />
        <KpiCard
          label="Середній залишок"
          value={`${kpi.avgBalance} дн.`}
          sub="На одного співробітника"
        />
        <KpiCard
          label="Від'ємний баланс"
          value={kpi.negCount}
          sub="Співробітників із борг. балансом"
          valueClass={kpi.negCount > 0 ? 'danger' : 'success'}
        />
        <KpiCard
          label={`Без відпустки ${currentYear}`}
          value={`${kpi.pctNoVac}%`}
          sub={`${kpi.noVacation2026} з ${filteredEmployees.length} осіб`}
          valueClass={kpi.pctNoVac > 50 ? 'warning' : 'success'}
        />
      </div>

      {/* Charts row 1 */}
      <div className="charts-grid">
        {/* Monthly usage */}
        <div className="chart-card">
          <div className="chart-title">Використання по місяцях {currentYear}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#6E6E73' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6E6E73' }}
                axisLine={false}
                tickLine={false}
              />
              <ReTooltip content={<CustomTooltip />} />
              <Bar dataKey="days" name="Днів" fill={COLORS.accent} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Year comparison */}
        <div className="chart-card">
          <div className="chart-title">Порівняння 2024 / 2025 / {currentYear}</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearCompare} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 12, fill: '#6E6E73' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6E6E73' }}
                axisLine={false}
                tickLine={false}
              />
              <ReTooltip content={<CustomTooltip />} />
              <Bar dataKey="days" name="Дні відпустки" radius={[5, 5, 0, 0]}>
                {yearCompare.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? COLORS.accent : index === 1 ? COLORS.purple : COLORS.teal}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        {/* Top-10 by balance */}
        <div className="chart-card">
          <div className="chart-title">Топ-10 за залишком відпустки</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              layout="vertical"
              data={top10}
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#6E6E73' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11, fill: '#1D1D1F' }}
                axisLine={false}
                tickLine={false}
              />
              <ReTooltip content={<CustomTooltip />} />
              <Bar
                dataKey="balance"
                name="Залишок"
                radius={[0, 5, 5, 0]}
                fill={COLORS.accent}
                isAnimationActive
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart: earned vs used */}
        <div className="chart-card">
          <div className="chart-title">Нараховано vs Використано ({currentYear})</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#6E6E73' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6E6E73' }}
                axisLine={false}
                tickLine={false}
              />
              <ReTooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#6E6E73', paddingTop: 8 }}
              />
              <Line
                type="monotone"
                dataKey="earned"
                name="Нараховано"
                stroke={COLORS.success}
                strokeWidth={2}
                dot={{ fill: COLORS.success, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="used"
                name="Використано"
                stroke={COLORS.danger}
                strokeWidth={2}
                dot={{ fill: COLORS.danger, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="forecast-table">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title">Прогноз на дату</div>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Розрахунок балансу на обрану дату
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Дата прогнозу:</label>
            <input
              type="date"
              value={forecastDateStr}
              onChange={e => setForecastDateStr(e.target.value)}
              className="form-input"
              style={{ fontSize: 13, padding: '4px 8px', width: 150 }}
            />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ПІБ</th>
              <th>Зароблено на {forecastLabel}</th>
              <th>Використано всього</th>
              <th>Прогнозний залишок</th>
            </tr>
          </thead>
          <tbody>
            {forecastData.map((row: any) => (
              <tr key={row.id}>
                <td style={{ fontWeight: 500 }}>{row.full_name}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {row.earned} дн.
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                  {row.usedTotal} дн.
                </td>
                <td>
                  <span
                    style={{
                      color: row.projectedBalance < 0
                        ? 'var(--danger)'
                        : row.projectedBalance < 5
                        ? 'var(--warning)'
                        : '#1a8a3a',
                      fontWeight: 600,
                    }}
                  >
                    {row.projectedBalance} дн.
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
