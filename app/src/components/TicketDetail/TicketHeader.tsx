// SPDX-License-Identifier: Apache-2.0
// TicketHeader (P5.2): quay lại, mã, badge, tiêu đề h1, meta, SLA, vùng hành động + nút In Biên bản Nghiệm thu.

import { ArrowLeft, FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Ticket } from '../../lib/api';
import { formatRelative } from '../../lib/format';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SlaProgress } from './SlaProgress';
import styles from './TicketDetail.module.css';
import { t } from '../../lib/i18n';

export function TicketHeader({
  ticket,
  backTo,
  now,
  actions,
  onOpenReport,
}: {
  ticket: Ticket;
  backTo: string;
  now: number;
  actions?: ReactNode;
  onOpenReport?: () => void;
}) {
  return (
    <header className={styles.header}>
      <Link to={backTo} className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t('ticket_header.quay_lai_danh_sach')}
      </Link>
      <div className={styles.headTop}>
        <span className={styles.code}>{ticket.ticket_number}</span>
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>
      <h1 className={styles.title}>{ticket.title}</h1>
      <p className={styles.metaLine}>
        {t('ticket_header.created_by', { name: ticket.customer_name || t('ticket_header.khong_ro'), when: formatRelative(ticket.created_at) })}
      </p>
      <SlaProgress ticket={ticket} now={now} />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
        {actions}
        {onOpenReport && (
          <Button variant="secondary" onClick={onOpenReport}>
            <FileText size={16} style={{ marginRight: '6px' }} />
            Biên bản nghiệm thu
          </Button>
        )}
      </div>
    </header>
  );
}
