// DX-FSM Dashboard – SLA panel
import styles from '../../pages/Dashboard.module.css';
import type { SLAStats } from '../../lib/api';

interface SLAPanelProps {
  sla: SLAStats;
}

function breachRateColor(rate: number): 'Good' | 'Warn' | 'Bad' {
  if (rate < 0.1) return 'Good';
  if (rate < 0.25) return 'Warn';
  return 'Bad';
}

export function SLAPanel({ sla }: SLAPanelProps) {
  const rate = sla.breach_rate;
  const color = breachRateColor(rate);
  const pct = (rate * 100).toFixed(1);

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>SLA Performance</h2>

      <div className={styles.breachRateBig}>
        <span className={color === 'Good' ? styles.colorGreen : color === 'Warn' ? styles.colorYellow : styles.colorRed}>
          {pct}%
        </span>
        <span className={styles.statHint} style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>
          breach rate
        </span>
      </div>
      <div className={styles.breachRateBar}>
        <div
          className={`${styles.breachRateFill} ${
            color === 'Good'
              ? styles.breachRateFillGood
              : color === 'Warn'
              ? styles.breachRateFillWarn
              : styles.breachRateFillBad
          }`}
          style={{ width: `${Math.min(100, rate * 100)}%` }}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>Active tickets</span>
          <span className={styles.slaValue}>{sla.total_active}</span>
        </div>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>On time</span>
          <span className={styles.slaValue} style={{ color: '#10b981' }}>{sla.on_time}</span>
        </div>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>Breached (active)</span>
          <span className={styles.slaValue} style={{ color: '#ef4444' }}>{sla.breached}</span>
        </div>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>SLA met (resolved/closed)</span>
          <span className={styles.slaValue} style={{ color: '#10b981' }}>{sla.met}</span>
        </div>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>SLA not met</span>
          <span className={styles.slaValue} style={{ color: '#ef4444' }}>{sla.not_met}</span>
        </div>
      </div>
    </div>
  );
}
