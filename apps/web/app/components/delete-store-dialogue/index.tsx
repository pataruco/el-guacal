// "Suggest deletion" dialog. Used to propose removal of a store
// rather than hard-delete it — submission becomes a pending
// proposal that a moderator reviews, mirroring the edit flow.
// Asks for a reason (required) explaining why the location
// should be removed; that text lands in the proposal record for
// the moderator to read.
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.scss';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  itemName: string;
}

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}: DeleteConfirmationDialogProps) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      setReason('');
    }
  }, [isOpen]);

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length === 0) return;
    onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles['c-dialog']}
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      <h2 className={styles['c-dialog__title']}>{t('deleteDialog.title')}</h2>
      <p className={styles['c-dialog__warning']}>{t('deleteDialog.warning')}</p>
      <p
        id="delete-reason-description"
        className={styles['c-dialog__suggestion']}
      >
        {t('deleteDialog.reasonPrompt', { name: itemName })}
      </p>
      <label htmlFor="delete-reason-input" className="sr-only">
        {t('deleteDialog.inputLabel', { name: itemName })}
      </label>
      <textarea
        id="delete-reason-input"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t('deleteDialog.inputPlaceholder')}
        className={styles['c-dialog__textarea']}
        aria-describedby="delete-reason-description"
        rows={3}
        required
        autoFocus
      />
      <div className={styles['c-dialog__actions']}>
        <button
          type="button"
          onClick={handleCancel}
          className={`${styles['c-dialog__btn']} ${styles['c-dialog__btn--cancel']}`}
        >
          {t('deleteDialog.cancel')}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={reason.trim().length === 0}
          className={`${styles['c-dialog__btn']} ${styles['c-dialog__btn--delete']}`}
        >
          {t('deleteDialog.confirm')}
        </button>
      </div>
    </dialog>
  );
};

export default DeleteConfirmationDialog;
