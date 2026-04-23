'use client';

import { useState } from 'react';
import {
  generateReportAction,
  runImportAction,
  mapEmployeesAction,
  getCoverageAction,
  getLastSyncAction,
} from '@/lib/actions/sageSync';
import type { Discrepancy } from '@/lib/sage-hr/sync';

type LastSync = {
  id: number;
  syncedAt: Date;
  recordsAdded: number;
  recordsUpdated: number;
  discrepancies: unknown;
  errors: unknown;
} | null;

export default function SageSyncPage() {
  const [report, setReport] = useState<Discrepancy[] | null>(null);
  const [importResult, setImportResult] = useState<{
    added: number;
    updated: number;
  } | null>(null);
  const [coverage, setCoverage] = useState<{
    mapped: number;
    unmapped: number;
    total: number;
    unmappedEmployees: { fullName: string; email: string | null }[];
  } | null>(null);
  const [lastSync, setLastSync] = useState<LastSync>(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setLoading('report');
    setError(null);
    const result = await generateReportAction();
    if (result.success) {
      setReport(result.data);
    } else {
      setError(result.error);
    }
    setLoading('');
  };

  const handleImport = async () => {
    if (!confirm('Запустити імпорт записів з Sage HR?')) return;
    setLoading('import');
    setError(null);
    const result = await runImportAction();
    if (result.success) {
      setImportResult({ added: result.data.added, updated: result.data.updated });
      setReport(result.data.discrepancies);
    } else {
      setError(result.error);
    }
    setLoading('');
  };

  const handleMapEmployees = async () => {
    setLoading('map');
    setError(null);
    const result = await mapEmployeesAction();
    if (result.success) {
      alert(`Mapped ${result.data.mapped} new employees (${result.data.total} total in Sage)`);
    } else {
      setError(result.error);
    }
    setLoading('');
  };

  const handleGetCoverage = async () => {
    setLoading('coverage');
    setError(null);
    const result = await getCoverageAction();
    if (result.success) {
      setCoverage(result.data);
    } else {
      setError(result.error);
    }
    setLoading('');
  };

  const handleGetLastSync = async () => {
    const result = await getLastSyncAction();
    if (result.success) {
      setLastSync(result.data as LastSync);
    }
  };

  const discrepancyTypeLabel = (type: string) => {
    switch (type) {
      case 'in_sage_only': return 'Тільки в Sage';
      case 'in_dashboard_only': return 'Тільки в дашборді';
      case 'day_count_mismatch': return 'Розбіжність днів';
      default: return type;
    }
  };

  const discrepancyTypeColor = (type: string) => {
    switch (type) {
      case 'in_sage_only': return '#E8F5E9';
      case 'in_dashboard_only': return '#FFF3E0';
      case 'day_count_mismatch': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  const grouped = report
    ? {
        in_sage_only: report.filter((d) => d.type === 'in_sage_only'),
        in_dashboard_only: report.filter((d) => d.type === 'in_dashboard_only'),
        day_count_mismatch: report.filter((d) => d.type === 'day_count_mismatch'),
      }
    : null;

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Sage HR Sync</h1>
      <p style={{ color: '#6E6E73', fontSize: 13, marginBottom: 24 }}>
        Синхронізація відпусток з Sage HR (односторонній імпорт)
      </p>

      {error && (
        <div style={{ padding: '10px 16px', background: '#FFEBEE', color: '#C62828', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={handleMapEmployees}
          disabled={loading === 'map'}
          style={btnStyle}
        >
          {loading === 'map' ? 'Mapping...' : 'Map Employees by Email'}
        </button>
        <button
          onClick={handleGetCoverage}
          disabled={loading === 'coverage'}
          style={btnStyle}
        >
          {loading === 'coverage' ? 'Loading...' : 'Check Coverage'}
        </button>
        <button
          onClick={handleGenerateReport}
          disabled={loading === 'report'}
          style={{ ...btnStyle, background: '#1D1D1F', color: '#fff' }}
        >
          {loading === 'report' ? 'Generating...' : 'Generate Report'}
        </button>
        <button
          onClick={handleImport}
          disabled={loading === 'import' || !report}
          style={{ ...btnStyle, background: report ? '#34C759' : '#ccc', color: '#fff' }}
        >
          {loading === 'import' ? 'Importing...' : 'Run Import'}
        </button>
        <button onClick={handleGetLastSync} style={{ ...btnStyle, background: '#F5F5F7' }}>
          Last Sync
        </button>
      </div>

      {/* Coverage */}
      {coverage && (
        <div style={{ marginBottom: 24, padding: 16, background: '#F5F5F7', borderRadius: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Mapping Coverage</h3>
          <div style={{ fontSize: 13 }}>
            Mapped: <strong>{coverage.mapped}</strong> / {coverage.total} &nbsp;|&nbsp;
            Unmapped: <strong>{coverage.unmapped}</strong>
          </div>
          {coverage.unmappedEmployees.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#6E6E73', marginBottom: 4 }}>Unmapped:</div>
              {coverage.unmappedEmployees.map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: '#1D1D1F' }}>
                  {e.fullName} — {e.email ?? 'no email'}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div style={{ marginBottom: 24, padding: 16, background: '#E8F5E9', borderRadius: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#2E7D32', marginBottom: 4 }}>Import Complete</h3>
          <div style={{ fontSize: 13 }}>
            Added: <strong>{importResult.added}</strong> &nbsp;|&nbsp;
            Updated: <strong>{importResult.updated}</strong>
          </div>
        </div>
      )}

      {/* Last sync */}
      {lastSync && (
        <div style={{ marginBottom: 24, padding: 16, background: '#F5F5F7', borderRadius: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Last Sync</h3>
          <div style={{ fontSize: 13 }}>
            Date: <strong>{new Date(lastSync.syncedAt).toLocaleString('uk-UA')}</strong> &nbsp;|&nbsp;
            Added: {lastSync.recordsAdded} &nbsp;|&nbsp;
            Updated: {lastSync.recordsUpdated}
          </div>
        </div>
      )}

      {/* Discrepancy report */}
      {grouped && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Discrepancy Report ({report!.length} items)
          </h2>

          {report!.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#6E6E73', fontSize: 13 }}>
              No discrepancies found
            </div>
          )}

          {(['in_sage_only', 'in_dashboard_only', 'day_count_mismatch'] as const).map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            return (
              <div key={type} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#1D1D1F' }}>
                  {discrepancyTypeLabel(type)} ({items.length})
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F5F5F7' }}>
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Start Date</th>
                      <th style={thStyle}>End Date</th>
                      <th style={thStyle}>Sage Days</th>
                      <th style={thStyle}>Dashboard Days</th>
                      <th style={thStyle}>Calendar Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((d, i) => (
                      <tr key={i} style={{ background: discrepancyTypeColor(type) }}>
                        <td style={tdStyle}>{d.employee}</td>
                        <td style={tdStyle}>{d.start_date}</td>
                        <td style={tdStyle}>{d.end_date ?? '—'}</td>
                        <td style={tdStyle}>{d.sage_days ?? '—'}</td>
                        <td style={tdStyle}>{d.dashboard_days ?? '—'}</td>
                        <td style={tdStyle}>{d.calendar_days ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #E5E5EA',
  background: '#fff',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  borderBottom: '1px solid #E5E5EA',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid #E5E5EA',
};
