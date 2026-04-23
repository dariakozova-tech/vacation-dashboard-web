'use client';

import { useState } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { differenceInYears } from 'date-fns';

const CATEGORY_TYPES = [
  { value: 'disability_1', label: 'Інвалідність 1 групи (30 дн/рік)' },
  { value: 'disability_2', label: 'Інвалідність 2 групи (30 дн/рік)' },
  { value: 'disability_3', label: 'Інвалідність 3 групи (26 дн/рік)' },
  { value: 'combat_veteran', label: 'Учасник бойових дій (УБД) (+14 дн)' },
];

export interface EmployeeCategoryForm {
  id?: number;
  category: string;
  since: string;
  effective_to?: string | null;
  notes?: string | null;
  delete?: boolean;
}

export interface EmployeeChildForm {
  id?: number;
  child_name?: string | null;
  birth_date: string;
  is_raised_alone?: boolean;
  notes?: string | null;
  delete?: boolean;
}

interface EmployeeModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  employee?: any | null;
  onSave: (data: {
    id?: number;
    fullName: string;
    hireDate: string;
    email?: string | null;
    isDeel?: boolean;
    annualBaseDays?: number;
    isSingleParent?: boolean;
    singleParentSince?: string | null;
    categories?: EmployeeCategoryForm[];
    children?: EmployeeChildForm[];
  }) => void;
  onClose: () => void;
}

function getChildAgeBadge(birthDate: string): { text: string; color: string; warning?: string; isPlaceholder?: boolean } | null {
  if (!birthDate) return null;
  const now = new Date();
  const birth = new Date(birthDate);
  const age = differenceInYears(now, birth);

  const isPlaceholder = birthDate === '2010-01-01';

  // Calculate months for more precise display
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const text = months > 0 ? `${years} р. ${months} міс.` : `${years} р.`;

  let warning: string | undefined;
  if (isPlaceholder) warning = '⚠️ Уточніть дату народження';
  else if (age === 14) warning = '⚠️ Останній рік до 15 р.';
  else if (age === 17) warning = '⚠️ Останній рік до 18 р.';

  const color = isPlaceholder ? 'var(--warning)' : age >= 18 ? 'var(--text-tertiary)' : age >= 15 ? 'var(--warning)' : 'var(--success)';

  return { text, color, warning, isPlaceholder };
}

export default function EmployeeModal({ employee, onSave, onClose }: EmployeeModalProps) {
  const isEdit = !!(employee && employee.id);

  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'children'>('general');

  const [fullName, setFullName] = useState(employee?.full_name || '');
  const [hireDate, setHireDate] = useState(employee?.hire_date || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [isDeel, setIsDeel] = useState(employee?.is_deel ?? false);
  const [annualBaseDays, setAnnualBaseDays] = useState(employee?.annualBaseDays ?? employee?.annual_base_days ?? 24);
  const [isSingleParent, setIsSingleParent] = useState(employee?.is_single_parent ?? false);
  const [singleParentSince, setSingleParentSince] = useState(employee?.single_parent_since || '');

  const [categories, setCategories] = useState<EmployeeCategoryForm[]>(
    employee?.categories?.map((c: any) => ({ ...c })) || []
  );
  const [children, setChildren] = useState<EmployeeChildForm[]>(
    employee?.children?.map((c: any) => ({ ...c })) || []
  );

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Введіть ПІБ';
    if (!hireDate) errs.hireDate = 'Оберіть дату прийому';
    if (isSingleParent && !singleParentSince) errs.singleParentSince = 'Вкажіть дату';

    categories.forEach((cat, idx) => {
      if (cat.delete) return;
      if (!cat.since) errs[`cat_${idx}_date`] = 'Оберіть дату надання';
    });

    children.forEach((ch, idx) => {
      if (ch.delete) return;
      if (!ch.birth_date) errs[`child_${idx}_date`] = 'Оберіть дату народження';
    });

    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.fullName || errs.hireDate || errs.singleParentSince) setActiveTab('general');
      else if (Object.keys(errs).some(k => k.startsWith('cat_'))) setActiveTab('categories');
      else if (Object.keys(errs).some(k => k.startsWith('child_'))) setActiveTab('children');
      return;
    }
    onSave({
      ...(isEdit ? { id: employee!.id } : {}),
      fullName: fullName.trim(),
      hireDate,
      email: email.trim() || null,
      isDeel,
      annualBaseDays: Number(annualBaseDays) || 24,
      isSingleParent,
      singleParentSince: isSingleParent ? singleParentSince || null : null,
      categories,
      children,
    });
  };

  const activeCategories = categories.filter(c => !c.delete);
  const activeChildren = children.filter(c => !c.delete);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2 className="modal-title">
            {isEdit ? 'Редагувати співробітника' : 'Додати співробітника'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 2, padding: '0 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {(['general', 'categories', 'children'] as const).map(tab => {
            const labels = { general: 'Загальні', categories: 'Пільги', children: 'Діти' };
            const count = tab === 'categories' ? activeCategories.length : tab === 'children' ? activeChildren.length : 0;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 16px', background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {labels[tab]} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>

            {/* ── GENERAL TAB ─────────────────────────────────────────── */}
            <div style={{ display: activeTab === 'general' ? 'block' : 'none' }}>
              <div className="form-group">
                <label className="form-label">ПІБ *</label>
                <input type="text" className="form-input" placeholder="Прізвище Ім'я По-батькові"
                  value={fullName} onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: null })); }} autoFocus />
                {errors.fullName && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.fullName}</span>}
              </div>

              <div className="date-range-row">
                <div className="form-group">
                  <label className="form-label">Дата прийому *</label>
                  <input type="date" className="form-input" value={hireDate}
                    onChange={e => { setHireDate(e.target.value); setErrors(p => ({ ...p, hireDate: null })); }} />
                  {errors.hireDate && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.hireDate}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Норма днів / рік</label>
                  <input type="number" className="form-input" value={annualBaseDays}
                    onChange={e => setAnnualBaseDays(Number(e.target.value))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email (опціонально)</label>
                <input type="email" className="form-input" placeholder="example@company.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginTop: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isDeel} onChange={e => setIsDeel(e.target.checked)} />
                  <span className="form-label" style={{ marginBottom: 0 }}>Deel-співробітник</span>
                </label>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isSingleParent}
                    onChange={e => { setIsSingleParent(e.target.checked); if (!e.target.checked) setSingleParentSince(''); }} />
                  <span className="form-label" style={{ marginBottom: 0 }}>Одинока мати / батько</span>
                </label>
                {isSingleParent && (
                  <div className="form-group" style={{ marginTop: 8, marginLeft: 26 }}>
                    <label className="form-label" style={{ fontSize: 11 }}>З якого числа *</label>
                    <input type="date" className="form-input" value={singleParentSince}
                      onChange={e => { setSingleParentSince(e.target.value); setErrors(p => ({ ...p, singleParentSince: null })); }} />
                    {errors.singleParentSince && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{errors.singleParentSince}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* ── CATEGORIES TAB ──────────────────────────────────────── */}
            <div style={{ display: activeTab === 'categories' ? 'block' : 'none' }}>
              {categories.map((cat, idx) => {
                if (cat.delete) return null;
                return (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <label className="form-label" style={{ margin: 0 }}>Пільгова категорія</label>
                      <button type="button" className="btn btn-icon btn-danger" onClick={() => {
                        const newArr = [...categories];
                        if (newArr[idx].id) newArr[idx].delete = true;
                        else newArr.splice(idx, 1);
                        setCategories(newArr);
                      }}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <select className="form-input form-select" value={cat.category}
                      onChange={e => { const newArr = [...categories]; newArr[idx].category = e.target.value; setCategories(newArr); }}
                      style={{ marginBottom: 10 }}>
                      {CATEGORY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>

                    <div className="date-range-row" style={{ marginBottom: 10 }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11 }}>Дата надання *</label>
                        <input type="date" className="form-input" value={cat.since}
                          onChange={e => { const newArr = [...categories]; newArr[idx].since = e.target.value; setCategories(newArr); setErrors(p => ({ ...p, [`cat_${idx}_date`]: null })); }} />
                        {errors[`cat_${idx}_date`] && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{errors[`cat_${idx}_date`]}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11 }}>Діє по</label>
                        <input type="date" className="form-input" value={cat.effective_to || ''} placeholder="необмежено"
                          onChange={e => { const newArr = [...categories]; newArr[idx].effective_to = e.target.value || null; setCategories(newArr); }} />
                      </div>
                    </div>
                  </div>
                );
              })}

              <button type="button" className="btn btn-secondary"
                onClick={() => setCategories([...categories, { category: 'combat_veteran', since: '' }])}>
                <Plus size={13} /> Додати категорію
              </button>
            </div>

            {/* ── CHILDREN TAB ────────────────────────────────────────── */}
            <div style={{ display: activeTab === 'children' ? 'block' : 'none' }}>
              {children.map((ch, idx) => {
                if (ch.delete) return null;
                const ageBadge = getChildAgeBadge(ch.birth_date);
                return (
                  <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label className="form-label" style={{ margin: 0 }}>Дитина</label>
                        {ageBadge && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: ageBadge.color, background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 6 }}>
                            {ageBadge.text}
                          </span>
                        )}
                      </div>
                      <button type="button" className="btn btn-icon btn-danger" onClick={() => {
                        const newArr = [...children];
                        if (newArr[idx].id) newArr[idx].delete = true;
                        else newArr.splice(idx, 1);
                        setChildren(newArr);
                      }}>
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="date-range-row" style={{ marginBottom: 6 }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11 }}>Ім'я (необов'язково)</label>
                        <input type="text" className="form-input" value={ch.child_name || ''}
                          onChange={e => { const newArr = [...children]; newArr[idx].child_name = e.target.value; setChildren(newArr); }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11 }}>Дата народження *</label>
                        <input type="date" className="form-input" value={ch.birth_date}
                          onChange={e => { const newArr = [...children]; newArr[idx].birth_date = e.target.value; setChildren(newArr); setErrors(p => ({ ...p, [`child_${idx}_date`]: null })); }} />
                        {errors[`child_${idx}_date`] && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{errors[`child_${idx}_date`]}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                        <input type="checkbox" checked={ch.is_raised_alone ?? false}
                          onChange={e => { const newArr = [...children]; newArr[idx].is_raised_alone = e.target.checked; setChildren(newArr); }} />
                        Виховує самостійно (без другого з батьків)
                      </label>
                    </div>

                    <div className="form-group" style={{ marginTop: 6 }}>
                      <label className="form-label" style={{ fontSize: 11 }}>Нотатки</label>
                      <input type="text" className="form-input" placeholder="Необов'язково" value={ch.notes || ''}
                        onChange={e => { const newArr = [...children]; newArr[idx].notes = e.target.value || null; setChildren(newArr); }} />
                    </div>

                    {ageBadge?.warning && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>
                        <AlertTriangle size={12} /> {ageBadge.warning}
                      </div>
                    )}
                  </div>
                );
              })}

              <button type="button" className="btn btn-secondary"
                onClick={() => setChildren([...children, { birth_date: '' }])}>
                <Plus size={13} /> Додати дитину
              </button>
            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Зберегти зміни' : 'Додати співробітника'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
