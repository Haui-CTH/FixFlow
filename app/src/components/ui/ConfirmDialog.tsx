// SPDX-License-Identifier: Apache-2.0
// ConfirmDialog (P5.5): hỏi xác nhận trước hành động khó hoàn tác.

import { Button } from './Button';
import { Modal } from './Modal';
import styles from './ui.module.css';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className={styles.confirmText}>{message}</p>
      <div className={styles.confirmActions}>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Huỷ bỏ
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
