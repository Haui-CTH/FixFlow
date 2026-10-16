// DX-FSM Dashboard – Reusable stat card component
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
}

export function MetricCard({ label, value, hint, color = 'gray' }: MetricCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${colorMap[color]}`}>{value}</div>
      {hint && <div className={styles.statHint}>{hint}</div>}
    </div>
  );
}
