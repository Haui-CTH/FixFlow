// SPDX-License-Identifier: Apache-2.0
// Overview (P5.4): mô tả + lưới thông tin.

import type { Ticket } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { categoryMeta } from '../../lib/ticket-meta';
import { Card } from '../ui/Card';
import styles from './TicketDetail.module.css';

export function Overview({ ticket }: { ticket: Ticket }) {
  const rows: [string, string][] = [
    ['Khách hàng', ticket.customer_name || '-'],
    ['Email', ticket.customer_email || '-'],
    ['Địa điểm', ticket.customer_location || '-'],
    ['Kỹ thuật viên', ticket.technician_name || 'Chưa giao'],
    ['Danh mục', categoryMeta(ticket.category).label],
    ['Ngày tạo', formatDate(ticket.created_at, true)],
    ['Cập nhật', formatDate(ticket.updated_at, true)],
  ];
  return (
    <Card>
      <h2 className={styles.h2}>Mô tả</h2>
      <p className={styles.description}>{ticket.description || 'Không có mô tả'}</p>
      <h2 className={styles.h2}>Thông tin</h2>
      <dl className={styles.metaGrid}>
        {rows.map(([k, v]) => (
          <div key={k} className={styles.metaItem}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
