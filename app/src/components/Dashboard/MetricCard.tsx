// DX-FSM Dashboard – Reusable stat card component (B6.3)
import type { LucideIcon } from 'lucide-react';
import styles from '../../pages/Dashboard.module.css';

type ColorKey = 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple';

const colorMap: Record<ColorKey, string> = {
  blue: styles.colorBlue,
  yellow: styles.colorYellow,
  green: styles.colorGreen,
  red: styles.colorRed,
  gray: styles.colorGray,
  purple: styles.colorPurple,
};

interface MetricCardProps {
  label: string;
  value: number | string;
  hint?: string;
  color?: ColorKey;
  icon?: LucideIcon; // kèm icon để không chỉ dựa vào màu
}

export function MetricCard({ label, value, hint, color = 'gray', icon: Icon }: MetricCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>
        {Icon && <Icon size={16} aria-hidden="true" />}
        {label}
      </div>
      <div className={`${styles.statValue} ${colorMap[color]}`}>{value}</div>
      {hint && <div className={styles.statHint}>{hint}</div>}
    </div>
  );
}
