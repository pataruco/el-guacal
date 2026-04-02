import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.scss';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
}

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
}: DeleteConfirmationDialogProps) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [inputValue, setInputValue] = useState('');

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
      setInputValue('');
    }
  }, [isOpen]);

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    if (inputValue === itemName) {
      onConfirm();
    }
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
      <h2 className={styles['c-dialog__title']}>
        {t('deleteDialog.title', { type: itemType })}
      </h2>
      <p className={styles['c-dialog__warning']}>
        {t('deleteDialog.warning', { type: itemType.toLowerCase() })}
      </p>
      <p
        id="delete-confirm-description"
        className={styles['c-dialog__suggestion']}
      >
        {t('deleteDialog.confirmPrompt')} <strong>{itemName}</strong>
      </p>
      <label htmlFor="delete-confirm-input" className="sr-only">
        {t('deleteDialog.inputLabel', { type: itemType.toLowerCase() })}
      </label>
      <input
        id="delete-confirm-input"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={t('deleteDialog.inputPlaceholder', {
          type: itemType.toLowerCase(),
        })}
        className={styles['c-dialog__input']}
        aria-describedby="delete-confirm-description"
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
          disabled={inputValue !== itemName}
          className={`${styles['c-dialog__btn']} ${styles['c-dialog__btn--delete']}`}
        >
          {t('deleteDialog.confirm')}
        </button>
      </div>
    </dialog>
  );
};

export default DeleteConfirmationDialog;
