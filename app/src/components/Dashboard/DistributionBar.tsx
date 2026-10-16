// DX-FSM Dashboard – Distribution bar row (priority / category)
import styles from '../../pages/Dashboard.module.css';

type FillColor = 'blue' | 'yellow' | 'orange' | 'red' | 'green' | 'gray' | 'purple';

const fillMap: Record<FillColor, string> = {
  blue: styles.fillBlue,
  yellow: styles.fillYellow,
  orange: styles.fillOrange,
  red: styles.fillRed,
  green: styles.fillGreen,
  gray: styles.fillGray,
  purple: styles.fillPurple,
};

interface DistributionBarProps {
  label: string;
  count: number;
  total: number;
  color?: FillColor;
}

/**
 * Horizontal bar showing count vs total. Width = (count/total) * 100%.
 * Auto-skips if total = 0 (no division by zero).
 */
export function DistributionBar({ label, count, total, color = 'blue' }: DistributionBarProps) {
  const pct = total > 0 ? Math.min(100, (count / total) * 100) : 0;
  return (
    <div className={styles.distRow}>
      <div className={styles.distLabel}>{label}</div>
      <div className={styles.distBarTrack}>
        <div
          className={`${styles.distBarFill} ${fillMap[color]}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      <div className={styles.distCount}>{count}</div>
    </div>
  );
}
