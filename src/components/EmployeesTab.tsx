'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import Tooltip from './Tooltip';
import EmployeeDetail from './EmployeeDetail';
import { formatDate, VacationRecordInput } from '@/lib/utils/vacationLogic';

interface EmployeeRow {
  id: number;
  full_name: string;
  hire_date: string;
  is_deel?: boolean;
  email?: string | null;
  earned: number;
  used2024: number;
  used2025: number;
  used2026: number;
  balance: number;
  wasReset: boolean;
  resetDays: number;
  records: VacationRecordInput[];
  [key: string]: unknown;
}

type SortKey = 'full_name' | 'hire_date' | 'earned' | 'used2024' | 'used2025' | 'used2026' | 'balance';

interface SortConfig {
  key: SortKey;
  dir: 'asc' | 'desc';
}

const COLUMNS: { key: SortKey | '_expand'; label: string; sortable: boolean; width: string }[] = [
  { key: 'full_name', label: 'ПІБ', sortable: true, width: '26%' },
  { key: 'hire_date', label: 'Дата прийому', sortable: true, width: '13%' },
  { key: 'earned', label: 'Зароблено', sortable: true, width: '12%' },
  { key: 'used2024', label: 'Викор. 2024', sortable: true, width: '12%' },
  { key: 'used2025', label: 'Викор. 2025', sortable: true, width: '12%' },
  { key: 'used2026', label: 'Викор. 2026', sortable: true, width: '12%' },
  { key: 'balance', label: 'Залишок', sortable: true, width: '13%' },
];

// ── Balance Chip ──────────────────────────────────────────────────────────────
function BalanceChip({ value }: { value: number }) {
  if (value < 0) return <span className="balance-chip danger">{value} дн.</span>;
  if (value < 3) return <span className="balance-chip warning">{value} дн.</span>;
  return <span className="balance-chip positive">+{value} дн.</span>;
}

// ── Sort Icon ─────────────────────────────────────────────────────────────────
function SortIcon({ colKey, sortConfig }: { colKey: string; sortConfig: SortConfig }) {
  if (sortConfig.key !== colKey) {
    return <span className="sort-indicator" style={{ opacity: 0.2 }}>↕</span>;
  }
  return <span className="sort-indicator">{sortConfig.dir === 'asc' ? '↑' : '↓'}</span>;
}

// ── Employee Table ────────────────────────────────────────────────────────────
function EmployeeTable({
  employees,
  sortConfig,
  onSort,
  expandedId,
  onToggleExpand,
}: {
  employees: EmployeeRow[];
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  expandedId: number | null;
  onToggleExpand: (id: number) => void;
}) {
  if (employees.length === 0) return null;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: 40 }}></th>
          {COLUMNS.map((col) => (
            <th
              key={col.key}
              style={{ width: col.width }}
              className={sortConfig.key === col.key ? 'sorted' : ''}
              onClick={() => col.sortable && onSort(col.key as SortKey)}
            >
              {col.label}
              {col.sortable && <SortIcon colKey={col.key} sortConfig={sortConfig} />}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {employees.map((emp) => (
          <>
            {/* Main row */}
            <tr
              key={`row-${emp.id}`}
              className={expandedId === emp.id ? 'expanded' : ''}
              onClick={() => onToggleExpand(emp.id)}
            >
              {/* Expand icon */}
              <td style={{ width: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                {expandedId === emp.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </td>

              {/* Name */}
              <td>
                <div className="employee-name-cell">
                  <span style={{ fontWeight: 500 }}>{emp.full_name}</span>
                  {emp.wasReset && (
                    <Tooltip text={`Баланс обнулено 01.01.2026: було −${emp.resetDays} дн.`}>
                      <span className="reset-badge" style={{ marginLeft: 6, fontSize: 14, cursor: 'default' }}>
                        ⚠
                      </span>
                    </Tooltip>
                  )}
                </div>
              </td>

              {/* Hire date */}
              <td style={{ color: 'var(--text-secondary)' }}>{formatDate(emp.hire_date)}</td>

              {/* Earned */}
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{emp.earned} дн.</td>

              {/* Used 2024 */}
              <td
                style={{
                  color: emp.used2024 > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {emp.used2024 > 0 ? `${emp.used2024} дн.` : '—'}
              </td>

              {/* Used 2025 */}
              <td
                style={{
                  color: emp.used2025 > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {emp.used2025 > 0 ? `${emp.used2025} дн.` : '—'}
              </td>

              {/* Used 2026 */}
              <td
                style={{
                  color: emp.used2026 > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {emp.used2026 > 0 ? `${emp.used2026} дн.` : '—'}
              </td>

              {/* Balance */}
              <td>
                <BalanceChip value={emp.balance} />
              </td>
            </tr>

            {/* Detail panel row */}
            <tr key={`detail-${emp.id}`} className="detail-row">
              <td colSpan={COLUMNS.length + 1}>
                <div className={`detail-panel ${expandedId === emp.id ? 'open' : ''}`}>
                  {expandedId === emp.id && (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <EmployeeDetail employee={emp as any} records={emp.records} />
                  )}
                </div>
              </td>
            </tr>
          </>
        ))}
      </tbody>
    </table>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmployeesTab({ employees }: { employees: EmployeeRow[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'full_name', dir: 'asc' });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let result = [...employees];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.full_name.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof EmployeeRow];
      const bVal = b[sortConfig.key as keyof EmployeeRow];

      if (sortConfig.key === 'hire_date') {
        const aStr = (aVal as string) || '';
        const bStr = (bVal as string) || '';
        return sortConfig.dir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }

      if (typeof aVal === 'string') {
        return sortConfig.dir === 'asc'
          ? aVal.localeCompare(bVal as string, 'uk')
          : (bVal as string).localeCompare(aVal, 'uk');
      }

      const aNum = (aVal as number) ?? -Infinity;
      const bNum = (bVal as number) ?? -Infinity;
      return sortConfig.dir === 'asc' ? aNum - bNum : bNum - aNum;
    });

    return result;
  }, [employees, searchQuery, sortConfig]);

  const tovFiltered = useMemo(() => filtered.filter((e) => !e.is_deel), [filtered]);
  const deelFiltered = useMemo(() => filtered.filter((e) => e.is_deel), [filtered]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const tableProps = {
    sortConfig,
    onSort: handleSort,
    expandedId,
    onToggleExpand: toggleExpand,
  };

  return (
    <div>
      <div className="table-container">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="search-input-wrap">
            <Search size={15} />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Пошук за ПІБ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {filtered.length} з {employees.length}
          </span>
        </div>

        {/* TOV section */}
        {tovFiltered.length > 0 && (
          <>
            <div
              style={{
                padding: '8px 16px 6px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--border)',
              }}
            >
              Співробітники ТОВ · {tovFiltered.length}
            </div>
            <EmployeeTable employees={tovFiltered} {...tableProps} />
          </>
        )}

        {/* Deel section */}
        {deelFiltered.length > 0 && (
          <>
            <div
              style={{
                padding: '8px 16px 6px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                borderTop: tovFiltered.length > 0 ? '2px solid var(--border)' : 'none',
                borderBottom: '1px solid var(--border)',
                background: '#FAFAFA',
              }}
            >
              Контрактори Deel · {deelFiltered.length}
            </div>
            <div style={{ background: '#FAFAFA' }}>
              <EmployeeTable employees={deelFiltered} {...tableProps} />
            </div>
          </>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-text">Співробітників не знайдено</div>
          </div>
        )}
      </div>
    </div>
  );
}
