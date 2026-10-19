// SPDX-License-Identifier: Apache-2.0
// Overview (P5.4): mô tả + lưới thông tin.

import type { Ticket } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { categoryMeta } from '../../lib/ticket-meta';
import { Card } from '../ui/Card';
import styles from './TicketDetail.module.css';
import { t } from '../../lib/i18n';

export function Overview({ ticket }: { ticket: Ticket }) {
  const rows: [string, string][] = [
    [t('overview.khach_hang'), ticket.customer_name || '-'],
    ['Email', ticket.customer_email || '-'],
    [t('overview.dia_diem'), ticket.customer_location || '-'],
    [t('overview.ky_thuat_vien'), ticket.technician_name || t('overview.chua_giao')],
    [t('overview.danh_muc'), categoryMeta(ticket.category).label],
    [t('overview.ngay_tao'), formatDate(ticket.created_at, true)],
    [t('overview.cap_nhat'), formatDate(ticket.updated_at, true)],
  ];
  return (
    <Card>
      <h2 className={styles.h2}>{t('overview.mo_ta')}</h2>
      <p className={styles.description}>{ticket.description || t('overview.khong_co_mo_ta')}</p>
      <h2 className={styles.h2}>{t('overview.thong_tin')}</h2>
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
