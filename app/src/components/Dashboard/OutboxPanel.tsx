// DX-FSM Dashboard – Outbox worker health panel
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

export function OutboxPanel({ outbox }: OutboxPanelProps) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Outbox Worker</h2>

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
