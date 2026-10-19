// SPDX-License-Identifier: Apache-2.0
// DX-FSM Tickets Page (F5.5: responsive table + card list)

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ticketApi } from '../lib/api';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge';
import { formatDate } from '../lib/format';
import styles from './Tickets.module.css';

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
                  return (
                    <tr key={ticket.id}>
                      <td>
                        <Link to={`/tickets/${ticket.id}`} className={styles.code}>
                          {ticket.ticket_number}
                        </Link>
                      </td>
                      <td className={styles.titleCell}>{ticket.title}</td>
                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className={styles.dateText}>
                        {formatDate(ticket.created_at)}
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
              return (
                <Link
                  to={`/tickets/${ticket.id}`}
                  key={ticket.id}
                  className={styles.card}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardCode}>{ticket.ticket_number}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className={styles.cardTitle}>{ticket.title}</p>
                  <div className={styles.cardBottom}>
                    <PriorityBadge priority={ticket.priority} />
                    <span>
                      {formatDate(ticket.created_at)}
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
