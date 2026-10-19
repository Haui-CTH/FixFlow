// SPDX-License-Identifier: Apache-2.0
// SlaCountdown (T3.6): còn/quá hạn; warning khi <25% thời gian; overdue kèm icon.

import { AlarmClock } from 'lucide-react';
import { slaInfo } from '../../lib/sla';
import type { Ticket } from '../../lib/api';
import styles from './Tickets.module.css';

export function SlaCountdown({ ticket, now }: { ticket: Ticket; now: number }) {
  const info = slaInfo(ticket.sla_deadline, ticket.status, ticket.created_at, now);
  if (!info) return <span className={styles.muted}>-</span>;
  return (
    <span className={`${styles.sla} tabular ${styles['sla-' + info.level]}`}>
      {info.level === 'overdue' && <AlarmClock size={14} aria-hidden="true" />}
      {info.text}
    </span>
  );
}
