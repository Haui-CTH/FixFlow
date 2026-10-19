// DX-FSM Dashboard – SLA panel (B6.6): gauge vòng SVG + ngưỡng chữ (Tốt/Chú ý/Nguy cấp)
import { AlertTriangle, CheckCircle2, XOctagon } from 'lucide-react';
import styles from '../../pages/Dashboard.module.css';
import type { SLAStats } from '../../lib/api';

interface SLAPanelProps {
  sla: SLAStats;
}

type Level = 'Good' | 'Warn' | 'Bad';

function breachRateColor(rate: number): Level {
  if (rate < 0.1) return 'Good';
  if (rate < 0.25) return 'Warn';
  return 'Bad';
}

const LEVEL = {
  Good: { text: 'Tốt', icon: CheckCircle2, color: styles.colorGreen, arc: styles.gaugeGood },
  Warn: { text: 'Chú ý', icon: AlertTriangle, color: styles.colorYellow, arc: styles.gaugeWarn },
  Bad: { text: 'Nguy cấp', icon: XOctagon, color: styles.colorRed, arc: styles.gaugeBad },
};

const R = 52;
const C = 2 * Math.PI * R;

export function SLAPanel({ sla }: SLAPanelProps) {
  const rate = sla.breach_rate;
  const level = breachRateColor(rate);
  const L = LEVEL[level];
  const Icon = L.icon;
  const pct = (rate * 100).toFixed(1);
  const filled = Math.min(1, Math.max(0, rate));

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>SLA Performance</h2>

      <div className={styles.slaTop}>
        <div
          className={styles.gauge}
          role="img"
          aria-label={`Tỉ lệ vi phạm SLA ${pct}%, mức ${L.text}`}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
            <circle className={styles.gaugeTrack} cx="60" cy="60" r={R} fill="none" strokeWidth="12" />
            <circle
              className={`${styles.gaugeArc} ${L.arc}`}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - filled)}
            />
          </svg>
          <div className={styles.gaugeCenter}>
            <span className={`${styles.breachRateBig} ${L.color}`}>{pct}%</span>
          </div>
        </div>
        <div>
          <div className={styles.statHint}>breach rate</div>
          <div className={`${styles.slaState} ${L.color}`}>
            <Icon size={16} aria-hidden="true" />
            {L.text}
          </div>
        </div>
      </div>

      <div className={styles.slaRows}>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>Active tickets</span>
          <span className={styles.slaValue}>{sla.total_active}</span>
        </div>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>On time</span>
          <span className={`${styles.slaValue} ${styles.slaGood}`}>{sla.on_time}</span>
        </div>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>Breached (active)</span>
          <span className={`${styles.slaValue} ${styles.slaBad}`}>{sla.breached}</span>
        </div>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>SLA met (resolved/closed)</span>
          <span className={`${styles.slaValue} ${styles.slaGood}`}>{sla.met}</span>
        </div>
        <div className={styles.slaRow}>
          <span className={styles.slaLabel}>SLA not met</span>
          <span className={`${styles.slaValue} ${styles.slaBad}`}>{sla.not_met}</span>
        </div>
      </div>
    </div>
  );
}
