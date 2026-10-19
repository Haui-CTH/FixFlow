// SPDX-License-Identifier: Apache-2.0
// DX-FSM Badge (D1.7) — icon + nhãn + tone, không chỉ dựa vào màu.

import type { ReactNode } from 'react';
import { priorityMeta, statusMeta, type Meta } from '../../lib/ticket-meta';
import styles from './ui.module.css';

export function Badge({ tone, icon: Icon, children }: { tone: Meta['tone']; icon?: Meta['icon']; children: ReactNode }) {
  return (
    <span className={`${styles.badge} ${styles['t-' + tone]}`}>
      {Icon && <Icon size={14} aria-hidden="true" />}
      {children}
    </span>
  );
}

const fromMeta = (m: Meta) => (
  <Badge tone={m.tone} icon={m.icon}>
    {m.label}
  </Badge>
);

export const StatusBadge = ({ status }: { status: string }) => fromMeta(statusMeta(status));
export const PriorityBadge = ({ priority }: { priority: string }) => fromMeta(priorityMeta(priority));
