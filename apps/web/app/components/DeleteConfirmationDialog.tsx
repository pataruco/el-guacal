import { useEffect, useRef, useState } from 'react';
import styles from './DeleteConfirmationDialog.module.scss';

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
      className={styles.dialog}
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      <h2>Delete {itemType}</h2>
      <p className={styles.warning}>
        This action cannot be undone. All data associated with this {itemType.toLowerCase()} will be permanently removed.
      </p>
      <p className={styles.suggestion}>
        Please type <strong>{itemName}</strong> to confirm.
      </p>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={`Type the ${itemType.toLowerCase()} name`}
        autoFocus
      />
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleCancel}
          className={styles.cancelBtn}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={inputValue !== itemName}
          className={styles.deleteBtn}
        >
          Delete
        </button>
      </div>
    </dialog>
  );
};

export default DeleteConfirmationDialog;
