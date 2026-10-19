// SPDX-License-Identifier: Apache-2.0
// DX-FSM Card + PageHeader (D1.8)

import type { HTMLAttributes, ReactNode } from 'react';
import styles from './ui.module.css';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={[styles.card, className].filter(Boolean).join(' ')} />;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {description && <p className={styles.pageDesc}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
