// SPDX-License-Identifier: Apache-2.0
// DX-FSM Ticket Detail Page (F5.5: responsive)
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../lib/api';
import { NotesPanel } from '../components/Notes/NotesPanel';
import { HistoryTimeline } from '../components/History/HistoryTimeline';
import styles from './TicketDetail.module.css';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <p className={styles.loading}>Đang tải...</p>;
  if (!ticket) return <p className={styles.error}>Ticket không tìm thấy</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{ticket.ticket_number}</h1>
      <div className={styles.card}>
        <h2 className={styles.heading}>{ticket.title}</h2>
        <p className={styles.description}>
          {ticket.description || 'Không có mô tả'}
        </p>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Trạng thái</div>
            <div className={styles.metaValue}>{ticket.status}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Ưu tiên</div>
            <div className={styles.metaValue}>{ticket.priority}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Danh mục</div>
            <div className={styles.metaValue}>{ticket.category}</div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>KTV</div>
            <div className={styles.metaValue}>
              {ticket.technician_name || 'Chưa giao'}
            </div>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaLabel}>Khách hàng</div>
            <div className={styles.metaValue}>
              {ticket.customer_name || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* F5.3: Internal notes panel (staff only, auto-hidden for customer) */}
      {id && <NotesPanel ticketId={id} />}

      {/* F5.4: History timeline (visible to all roles) */}
      {id && <HistoryTimeline ticketId={id} />}
    </div>
  );
}
