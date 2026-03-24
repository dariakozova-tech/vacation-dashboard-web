'use client';

import { useState } from 'react';
import { Users, BarChart2 } from 'lucide-react';
import EmployeesTab from './EmployeesTab';
import AnalyticsTab from './AnalyticsTab';

interface AppShellProps {
  employees: any[];
  allRecords: any[];
}

export default function AppShell({ employees, allRecords }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<'employees' | 'analytics'>('employees');

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
        <div className="topbar">
          <span className="topbar-title">
            {activeTab === 'employees' ? 'Баланс відпусток' : 'Аналітика'}
          </span>
        </div>

        <div className="content-area">
          {activeTab === 'employees' ? (
            <EmployeesTab employees={employees} />
          ) : (
            <AnalyticsTab employees={employees} allRecords={allRecords} />
          )}
        </div>
      </div>
    </div>
  );
}
