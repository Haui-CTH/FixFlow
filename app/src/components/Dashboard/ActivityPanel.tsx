// DX-FSM Dashboard – Hoạt động 24h (B6.7): 3 số + icon.
// ponytail: chưa có sparkline vì BE chưa trả chuỗi theo giờ/ngày.

import { AlarmClock, CheckCircle2, PlusCircle } from 'lucide-react';
import styles from '../../pages/Dashboard.module.css';
import type { RecentActivity } from '../../lib/api';

export function ActivityPanel({ activity }: { activity: RecentActivity }) {
  const items = [
    { label: 'Tạo mới', value: activity.last_24h_created, icon: PlusCircle, color: styles.colorBlue },
    { label: 'Đã giải quyết', value: activity.last_24h_resolved, icon: CheckCircle2, color: styles.colorGreen },
    {
      label: 'Vi phạm SLA',
      value: activity.last_24h_breached,
      icon: AlarmClock,
      color: activity.last_24h_breached > 0 ? styles.colorRed : styles.colorGray,
    },
  ];
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Hoạt động 24 giờ qua</h2>
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
