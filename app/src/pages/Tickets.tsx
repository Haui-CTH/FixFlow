// SPDX-License-Identifier: Apache-2.0
// DX-FSM Tickets Page (F5.5: responsive table + card list)

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ticketApi } from '../lib/api';
import styles from './Tickets.module.css';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Mới', color: '#3b82f6' },
  assigned: { label: 'Đã giao', color: '#8b5cf6' },
  in_progress: { label: 'Đang xử lý', color: '#f59e0b' },
  pending: { label: 'Chờ', color: '#6b7280' },
  resolved: { label: 'Đã giải quyết', color: '#10b981' },
  closed: { label: 'Đã đóng', color: '#374151' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

export default function Tickets() {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketApi.list().then((r) => r.data),
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tickets</h1>
        <Link to="/tickets/new" className={styles.createBtn}>
          + Tạo Ticket
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Đang tải…</div>
      ) : tickets.length === 0 ? (
        <div className={styles.empty}>Chưa có ticket nào</div>
      ) : (
        <>
          {/* Desktop table (>=769px) */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tiêu đề</th>
                  <th>Trạng thái</th>
                  <th>Ưu tiên</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const status = STATUS_LABELS[ticket.status] || { label: ticket.status, color: '#6b7280' };
                  return (
                    <tr key={ticket.id}>
                      <td>
                        <Link to={`/tickets/${ticket.id}`} className={styles.code}>
                          {ticket.ticket_number}
                        </Link>
                      </td>
                      <td className={styles.titleCell}>{ticket.title}</td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{ background: status.color + '20', color: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.priorityText}
                          style={{ color: PRIORITY_COLORS[ticket.priority] || '#6b7280' }}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className={styles.dateText}>
                        {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('vi-VN') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list (<=768px) */}
          <div className={styles.cardList}>
            {tickets.map((ticket) => {
              const status = STATUS_LABELS[ticket.status] || { label: ticket.status, color: '#6b7280' };
              return (
                <Link
                  to={`/tickets/${ticket.id}`}
                  key={ticket.id}
                  className={styles.card}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardCode}>{ticket.ticket_number}</span>
                    <span
                      className={styles.statusBadge}
                      style={{ background: status.color + '20', color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className={styles.cardTitle}>{ticket.title}</p>
                  <div className={styles.cardBottom}>
                    <span
                      className={styles.priorityText}
                      style={{ color: PRIORITY_COLORS[ticket.priority] || '#6b7280' }}
                    >
                      Ưu tiên: {ticket.priority}
                    </span>
                    <span>
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('vi-VN') : '-'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
