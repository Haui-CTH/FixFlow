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
  headingLevel = 2,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  headingLevel?: 1 | 2;
}) {
  const H = `h${headingLevel}` as 'h1' | 'h2';
  return (
    <div className={styles.state}>
      <Icon size={40} aria-hidden="true" />
      <H className={styles.stateTitle}>{title}</H>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Đã xảy ra lỗi',
  message,
  onRetry,
  headingLevel = 2,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  headingLevel?: 1 | 2;
}) {
  const H = `h${headingLevel}` as 'h1' | 'h2';
  return (
    <div className={`${styles.state} ${styles.errorState}`} role="alert">
      <AlertTriangle size={40} aria-hidden="true" />
      <H className={styles.stateTitle}>{title}</H>
      {message && <p>{message}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
