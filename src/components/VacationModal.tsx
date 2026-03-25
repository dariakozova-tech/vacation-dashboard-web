'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { calculatePeriodDays } from '@/lib/utils/vacationLogic';

const RECORD_TYPES = [
  { value: 'period', label: 'Період' },
  { value: 'days_sum', label: 'Сума днів' },
];

const YEARS = [2024, 2025, 2026];

interface VacationModalProps {
  employeeId: number;
  record?: {
    id: number;
    record_type: string;
    start_date?: string | null;
    end_date?: string | null;
    days_count?: number | null;
    year?: number | null;
    note?: string | null;
  } | null;
  onSave: (data: {
    id?: number;
    employeeId: number;
    recordType: string;
    startDate?: string | null;
    endDate?: string | null;
    daysCount?: number | null;
    year?: number | null;
    note?: string | null;
  }) => void;
  onClose: () => void;
}

export default function VacationModal({ employeeId, record, onSave, onClose }: VacationModalProps) {
  const isEdit = !!(record && record.id);

  const [recordType, setRecordType] = useState(record?.record_type || 'period');
  const [startDate, setStartDate] = useState(record?.start_date || '');
  const [endDate, setEndDate] = useState(record?.end_date || '');
  const [daysCount, setDaysCount] = useState(
    record?.days_count != null ? String(record.days_count) : ''
  );
  const [year, setYear] = useState(record?.year ? String(record.year) : '2026');
  const [note, setNote] = useState(record?.note || '');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // Auto-calculate days when period dates change
  useEffect(() => {
    if (recordType === 'period' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const days = calculatePeriodDays(startDate, endDate);
        setDaysCount(String(days));
      }
    }
  }, [startDate, endDate, recordType]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (recordType === 'period') {
      if (!startDate) errs.startDate = 'Оберіть дату початку';
      if (!endDate) errs.endDate = 'Оберіть дату кінця';
      if (startDate && endDate && endDate < startDate) {
        errs.endDate = 'Дата кінця має бути після дати початку';
      }
    }
    if (recordType === 'days_sum') {
      if (!year) errs.year = 'Оберіть рік';
      if (!daysCount || isNaN(parseFloat(daysCount)) || parseFloat(daysCount) <= 0) {
        errs.daysCount = 'Введіть кількість днів (> 0)';
      }
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      ...(isEdit ? { id: record!.id } : {}),
      employeeId,
      recordType,
      startDate: recordType === 'period' ? startDate : null,
      endDate: recordType === 'period' ? endDate : null,
      daysCount: daysCount ? parseFloat(daysCount) : null,
      year: recordType === 'days_sum' ? parseInt(year) : null,
      note: note.trim() || null,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? 'Редагувати відпустку' : 'Додати відпустку'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Record type selector */}
          <div className="form-group">
            <label className="form-label">Тип запису</label>
            <div className="segment-control">
              {RECORD_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`segment-btn${recordType === t.value ? ' active' : ''}`}
                  onClick={() => {
                    setRecordType(t.value);
                    setErrors({});
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Period fields */}
          {recordType === 'period' && (
            <>
              <div className="date-range-row">
                <div className="form-group">
                  <label className="form-label">Дата початку *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={e => { setStartDate(e.target.value); setErrors(p => ({ ...p, startDate: null })); }}
                  />
                  {errors.startDate && (
                    <span style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.startDate}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Дата кінця *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={e => { setEndDate(e.target.value); setErrors(p => ({ ...p, endDate: null })); }}
                  />
                  {errors.endDate && (
                    <span style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.endDate}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Кількість днів (auto)</label>
                <input
                  type="number"
                  className="form-input"
                  value={daysCount}
                  onChange={e => setDaysCount(e.target.value)}
                  min="0.5"
                  step="0.5"
                  placeholder="Автоматично"
                  style={{ background: 'rgba(0,0,0,0.03)' }}
                />
              </div>
            </>
          )}

          {/* Days sum fields */}
          {recordType === 'days_sum' && (
            <>
              <div className="form-group">
                <label className="form-label">Рік *</label>
                <select
                  className="form-input form-select"
                  value={year}
                  onChange={e => { setYear(e.target.value); setErrors(p => ({ ...p, year: null })); }}
                >
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.year && (
                  <span style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.year}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Кількість днів *</label>
                <input
                  type="number"
                  className="form-input"
                  value={daysCount}
                  onChange={e => { setDaysCount(e.target.value); setErrors(p => ({ ...p, daysCount: null })); }}
                  min="0.5"
                  step="0.5"
                  placeholder="0"
                  autoFocus
                />
                {errors.daysCount && (
                  <span style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.daysCount}</span>
                )}
              </div>
            </>
          )}

          {/* Note */}
          <div className="form-group">
            <label className="form-label">Нотатка (опціонально)</label>
            <textarea
              className="form-input"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Наприклад: щорічна відпустка, лікарняний..."
              rows={2}
            />
          </div>

          {/* Auto-calculated preview */}
          {recordType === 'period' && daysCount && startDate && endDate && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--accent-light)',
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--accent)',
              marginBottom: 4,
            }}>
              Тривалість: <strong>{daysCount} календарних днів</strong>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Скасувати
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Зберегти зміни' : 'Додати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
