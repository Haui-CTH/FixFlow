// DX-FSM Dashboard – Outbox worker health panel (B6.8)
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import styles from '../../pages/Dashboard.module.css';
import type { OutboxHealth } from '../../lib/api';

interface OutboxPanelProps {
  outbox: OutboxHealth;
}

function formatAge(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

// lỗi > đang chờ > khoẻ
export function outboxStatus(o: OutboxHealth): 'bad' | 'wait' | 'ok' {
  if (o.failed > 0) return 'bad';
  if (o.pending > 0 || o.sending > 0) return 'wait';
  return 'ok';
}

const BADGE = {
  bad: { text: 'Có lỗi', cls: styles.badgeBad, icon: AlertTriangle },
  wait: { text: 'Đang chờ', cls: styles.badgeWait, icon: Clock },
  ok: { text: 'Khoẻ', cls: styles.badgeOk, icon: CheckCircle2 },
};

export function OutboxPanel({ outbox }: OutboxPanelProps) {
  const b = BADGE[outboxStatus(outbox)];
  const Icon = b.icon;
  return (
    <div className={styles.section}>
      <div className={styles.outboxHead}>
        <h2 className={styles.sectionTitle}>Outbox Worker</h2>
        <span className={`${styles.badge} ${b.cls}`}>
          <Icon size={14} aria-hidden="true" />
          {b.text}
        </span>
      </div>

      <div className={styles.outboxGrid}>
        <div className={`${styles.outboxTile} ${styles.outboxTilePending}`}>
          <div className={styles.outboxTileValue}>{outbox.pending}</div>
          <div className={styles.outboxTileLabel}>Pending</div>
        </div>
        <div className={`${styles.outboxTile} ${styles.outboxTileSending}`}>
          <div className={styles.outboxTileValue}>{outbox.sending}</div>
          <div className={styles.outboxTileLabel}>Sending</div>
        </div>
        <div className={`${styles.outboxTile} ${styles.outboxTileSent}`}>
          <div className={styles.outboxTileValue}>{outbox.sent}</div>
          <div className={styles.outboxTileLabel}>Sent</div>
        </div>
        <div className={`${styles.outboxTile} ${styles.outboxTileFailed}`}>
          <div className={styles.outboxTileValue}>{outbox.failed}</div>
          <div className={styles.outboxTileLabel}>Failed</div>
        </div>
      </div>

      <div className={styles.outboxOldest}>
        Oldest pending: {formatAge(outbox.oldest_pending_age_sec)}
      </div>
    </div>
  );
}
