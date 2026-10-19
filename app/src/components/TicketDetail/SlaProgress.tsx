// SPDX-License-Identifier: Apache-2.0
// SlaProgress (P5.13): thanh tiến độ + chữ + icon, role=progressbar.

import { AlarmClock, Clock } from 'lucide-react';
import type { Ticket } from '../../lib/api';
import { slaInfo } from '../../lib/sla';
import styles from './TicketDetail.module.css';

export function slaPercent(ticket: Pick<Ticket, 'created_at' | 'sla_deadline'>, now: number): number {
  const start = Date.parse(ticket.created_at ?? '');
  const end = Date.parse(ticket.sla_deadline ?? '');
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

export function SlaProgress({ ticket, now }: { ticket: Ticket; now: number }) {
  const info = slaInfo(ticket.sla_deadline, ticket.status, ticket.created_at, now);
  if (!info) return null;
  const pct = slaPercent(ticket, now);
  const Icon = info.level === 'overdue' ? AlarmClock : Clock;
  const label = info.level === 'overdue' ? 'Quá hạn' : info.level === 'warning' ? 'Sắp hết hạn' : 'Trong hạn';
  return (
    <div className={styles.sla}>
      <span className={`${styles.slaText} ${styles['sla-' + info.level]} tabular`}>
        <Icon size={16} aria-hidden="true" />
        SLA: {info.text} · {label}
      </span>
      <div
        role="progressbar"
        aria-label="Tiến độ SLA"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className={styles.slaTrack}
      >
        <div className={`${styles.slaBar} ${styles['bar-' + info.level]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
