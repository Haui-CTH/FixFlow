// SPDX-License-Identifier: Apache-2.0
// TicketHeader (P5.2): quay lại, mã, badge, tiêu đề h1, meta, SLA, vùng hành động.

import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Ticket } from '../../lib/api';
import { formatRelative } from '../../lib/format';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { SlaProgress } from './SlaProgress';
import styles from './TicketDetail.module.css';

export function TicketHeader({
  ticket,
  backTo,
  now,
  actions,
}: {
  ticket: Ticket;
  backTo: string;
  now: number;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <Link to={backTo} className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        Quay lại danh sách
      </Link>
      <div className={styles.headTop}>
        <span className={styles.code}>{ticket.ticket_number}</span>
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>
      <h1 className={styles.title}>{ticket.title}</h1>
      <p className={styles.metaLine}>
        Tạo bởi {ticket.customer_name || 'không rõ'} · {formatRelative(ticket.created_at)}
      </p>
      <SlaProgress ticket={ticket} now={now} />
      {actions}
    </header>
  );
}
