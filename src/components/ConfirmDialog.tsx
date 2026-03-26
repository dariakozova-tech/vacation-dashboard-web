'use client';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div style={{ padding: '20px 20px 8px' }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Скасувати
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}
