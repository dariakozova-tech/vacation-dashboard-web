'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface EmployeeModalProps {
  employee?: { id: number; full_name: string; hire_date: string; email?: string | null; is_deel?: boolean } | null;
  onSave: (data: { id?: number; fullName: string; hireDate: string; email?: string | null; isDeel?: boolean }) => void;
  onClose: () => void;
}

export default function EmployeeModal({ employee, onSave, onClose }: EmployeeModalProps) {
  const isEdit = !!(employee && employee.id);

  const [fullName, setFullName] = useState(employee?.full_name || '');
  const [hireDate, setHireDate] = useState(employee?.hire_date || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [isDeel, setIsDeel] = useState(employee?.is_deel ?? false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Введіть ПІБ';
    if (!hireDate) errs.hireDate = 'Оберіть дату прийому';
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
      ...(isEdit ? { id: employee!.id } : {}),
      fullName: fullName.trim(),
      hireDate,
      email: email.trim() || null,
      isDeel,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? 'Редагувати співробітника' : 'Додати співробітника'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ПІБ *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Прізвище Ім'я По-батькові"
              value={fullName}
              onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: null })); }}
              autoFocus
            />
            {errors.fullName && (
              <span style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.fullName}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Дата прийому на роботу *</label>
            <input
              type="date"
              className="form-input"
              value={hireDate}
              onChange={e => { setHireDate(e.target.value); setErrors(p => ({ ...p, hireDate: null })); }}
              max={new Date().toISOString().slice(0, 10)}
            />
            {errors.hireDate && (
              <span style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.hireDate}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Email (опціонально)</label>
            <input
              type="email"
              className="form-input"
              placeholder="example@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isDeel}
                onChange={e => setIsDeel(e.target.checked)}
              />
              <span className="form-label" style={{ marginBottom: 0 }}>Deel-співробітник</span>
            </label>
          </div>

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
