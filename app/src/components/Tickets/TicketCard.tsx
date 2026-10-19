// SPDX-License-Identifier: Apache-2.0
// TicketCard (T3.7): toàn card là một link, không lồng link/nút.

import { Link } from 'react-router-dom';
import type { Ticket } from '../../lib/api';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { SlaCountdown } from './SlaCountdown';
import styles from './Tickets.module.css';

export function TicketCard({ ticket, now }: { ticket: Ticket; now: number }) {
  return (
    <Link to={`/tickets/${ticket.id}`} className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cardCode}>{ticket.ticket_number}</span>
        <StatusBadge status={ticket.status} />
      </div>
      <p className={styles.cardTitle}>{ticket.title}</p>
      <div className={styles.cardBottom}>
        <PriorityBadge priority={ticket.priority} />
        <span>{ticket.technician_name ?? 'Chưa giao'}</span>
        <SlaCountdown ticket={ticket} now={now} />
      </div>
    </Link>
  );
}
