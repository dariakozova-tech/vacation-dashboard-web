'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BarChart2, Plus } from 'lucide-react';
import EmployeesTab from './EmployeesTab';
import AnalyticsTab from './AnalyticsTab';
import EmployeeModal from './EmployeeModal';
import VacationModal from './VacationModal';
import ConfirmDialog from './ConfirmDialog';
import {
  addEmployeeAction,
  updateEmployeeAction,
  deleteEmployeeAction,
} from '@/lib/actions/employees';
import {
  addVacationRecordAction,
  updateVacationRecordAction,
  deleteVacationRecordAction,
} from '@/lib/actions/vacationRecords';
import { VacationRecordInput } from '@/lib/utils/vacationLogic';

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

interface AppShellProps {
  employees: EmployeeRow[];
  allRecords: VacationRecordInput[];
}

export default function AppShell({ employees, allRecords }: AppShellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'employees' | 'analytics'>('employees');

  // Modal state
  const [employeeModal, setEmployeeModal] = useState<EmployeeRow | null | 'add'>(null);
  const [vacationModal, setVacationModal] = useState<{ employeeId: number; record?: VacationRecordInput | null } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => Promise<void> } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Employee handlers ──────────────────────────────────────────────────────

  const handleSaveEmployee = async (data: {
    id?: number;
    fullName: string;
    hireDate: string;
    email?: string | null;
    isDeel?: boolean;
  }) => {
    setActionError(null);
    let result;
    if (data.id) {
      result = await updateEmployeeAction(data as { id: number; fullName?: string; hireDate?: string; isDeel?: boolean; email?: string | null });
    } else {
      result = await addEmployeeAction({ fullName: data.fullName, hireDate: data.hireDate, email: data.email, isDeel: data.isDeel });
    }
    if (result.success) {
      setEmployeeModal(null);
      startTransition(() => router.refresh());
    } else {
      setActionError(result.error);
    }
  };

  const handleDeleteEmployee = (emp: EmployeeRow) => {
    setConfirmDialog({
      message: `Видалити ${emp.full_name} та всі записи відпусток?`,
      onConfirm: async () => {
        const result = await deleteEmployeeAction(emp.id);
        if (result.success) {
          setConfirmDialog(null);
          startTransition(() => router.refresh());
        } else {
          setConfirmDialog(null);
          setActionError(result.error);
        }
      },
    });
  };

  // ── Vacation handlers ──────────────────────────────────────────────────────

  const handleSaveVacation = async (data: {
    id?: number;
    employeeId: number;
    recordType: string;
    startDate?: string | null;
    endDate?: string | null;
    daysCount?: number | null;
    year?: number | null;
    note?: string | null;
  }) => {
    setActionError(null);
    let result;
    if (data.id) {
      const { id, ...rest } = data;
      result = await updateVacationRecordAction({
        id,
        employeeId: rest.employeeId,
        recordType: rest.recordType as 'period' | 'days_sum' | 'balance_reset',
        startDate: rest.startDate,
        endDate: rest.endDate,
        daysCount: rest.daysCount,
        year: rest.year,
        note: rest.note,
      });
    } else {
      result = await addVacationRecordAction({
        employeeId: data.employeeId,
        recordType: data.recordType as 'period' | 'days_sum' | 'balance_reset',
        startDate: data.startDate,
        endDate: data.endDate,
        daysCount: data.daysCount,
        year: data.year,
        note: data.note,
      });
    }
    if (result.success) {
      setVacationModal(null);
      startTransition(() => router.refresh());
    } else {
      setActionError(result.error);
    }
  };

  const handleDeleteVacation = (recordId: number) => {
    setConfirmDialog({
      message: 'Видалити запис відпустки?',
      onConfirm: async () => {
        const result = await deleteVacationRecordAction(recordId);
        if (result.success) {
          setConfirmDialog(null);
          startTransition(() => router.refresh());
        } else {
          setConfirmDialog(null);
          setActionError(result.error);
        }
      },
    });
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-app-name">Відпустки</div>
          <div className="sidebar-company">ТОВ «Текері»</div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item${activeTab === 'employees' ? ' active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            <Users size={16} />
            Співробітники
          </button>
          <button
            className={`nav-item${activeTab === 'analytics' ? ' active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={16} />
            Аналітика
          </button>
        </nav>

        <div className="sidebar-footer">
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {employees.length} співробітників
          </span>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="topbar-title">
            {activeTab === 'employees' ? 'Баланс відпусток' : 'Аналітика'}
          </span>
          {activeTab === 'employees' && (
            <button
              className="btn btn-primary"
              style={{ fontSize: 13 }}
              onClick={() => setEmployeeModal('add')}
            >
              <Plus size={14} /> Додати
            </button>
          )}
        </div>

        <div className="content-area">
          {activeTab === 'employees' ? (
            <EmployeesTab
              employees={employees}
              onAddEmployee={() => setEmployeeModal('add')}
              onEditEmployee={(emp) => setEmployeeModal(emp)}
              onDeleteEmployee={(emp) => handleDeleteEmployee(emp)}
              onAddVacation={(employeeId) => setVacationModal({ employeeId })}
              onEditVacation={(employeeId, record) => setVacationModal({ employeeId, record })}
              onDeleteVacation={(recordId) => handleDeleteVacation(recordId)}
            />
          ) : (
            <AnalyticsTab employees={employees} allRecords={allRecords} />
          )}
        </div>
      </div>

      {/* Modals */}
      {employeeModal && (
        <EmployeeModal
          employee={employeeModal === 'add' ? null : employeeModal}
          onSave={handleSaveEmployee}
          onClose={() => { setEmployeeModal(null); setActionError(null); }}
        />
      )}
      {vacationModal && (
        <VacationModal
          employeeId={vacationModal.employeeId}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          record={(vacationModal.record ?? null) as any}
          onSave={handleSaveVacation}
          onClose={() => { setVacationModal(null); setActionError(null); }}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      {actionError && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: 'var(--danger)', background: '#fff', padding: '8px 16px', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.15)', zIndex: 1001 }}>
          {actionError}
        </div>
      )}
    </div>
  );
}
