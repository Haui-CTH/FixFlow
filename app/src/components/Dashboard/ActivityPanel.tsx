// SPDX-License-Identifier: Apache-2.0
// DX-FSM Dashboard – Hoạt động 24h (B6.7): 3 số + icon.
// ponytail: chưa có sparkline vì BE chưa trả chuỗi theo giờ/ngày.

import { AlarmClock, CheckCircle2, PlusCircle } from 'lucide-react';
import styles from '../../pages/Dashboard.module.css';
import type { RecentActivity } from '../../lib/api';
import { t } from '../../lib/i18n';

export function ActivityPanel({ activity }: { activity: RecentActivity }) {
  const items = [
    { label: t('activity_panel.tao_moi'), value: activity.last_24h_created, icon: PlusCircle, color: styles.colorBlue },
    { label: t('activity_panel.da_giai_quyet'), value: activity.last_24h_resolved, icon: CheckCircle2, color: styles.colorGreen },
    {
      label: t('activity_panel.vi_pham_sla'),
      value: activity.last_24h_breached,
      icon: AlarmClock,
      color: activity.last_24h_breached > 0 ? styles.colorRed : styles.colorGray,
    },
  ];
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('activity_panel.hoat_dong_24_gio_qua')}</h2>
      <div className={styles.activityGrid}>
        {items.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={styles.activityItem}>
            <span className={styles.activityLabel}>
              <Icon size={16} aria-hidden="true" />
              {label}
            </span>
            <span className={`${styles.activityValue} ${color}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
