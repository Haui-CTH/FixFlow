// SPDX-License-Identifier: Apache-2.0
// DX-FSM EmptyState + ErrorState (D1.10)

import { AlertTriangle, Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './ui.module.css';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <Icon size={40} aria-hidden="true" />
      <h2 className={styles.stateTitle}>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Đã xảy ra lỗi',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className={`${styles.state} ${styles.errorState}`} role="alert">
      <AlertTriangle size={40} aria-hidden="true" />
      <h2 className={styles.stateTitle}>{title}</h2>
      {message && <p>{message}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
