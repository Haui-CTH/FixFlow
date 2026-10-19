// SPDX-License-Identifier: Apache-2.0
// DX-FSM Dashboard – Outbox worker health panel (B6.8)
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import styles from '../../pages/Dashboard.module.css';
import type { OutboxHealth } from '../../lib/api';
import { t } from '../../lib/i18n';

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

const badges = () => ({
  bad: { text: t('outbox_panel.co_loi'), cls: styles.badgeBad, icon: AlertTriangle },
  wait: { text: t('outbox_panel.dang_cho_gui'), cls: styles.badgeWait, icon: Clock },
  ok: { text: t('outbox_panel.khoe'), cls: styles.badgeOk, icon: CheckCircle2 },
});

export function OutboxPanel({ outbox }: OutboxPanelProps) {
  const b = badges()[outboxStatus(outbox)];
  const Icon = b.icon;
  return (
    <div className={styles.section}>
      <div className={styles.outboxHead}>
        <h2 className={styles.sectionTitle}>{t('outbox_panel.hang_doi_su_kien')}</h2>
        <span className={`${styles.badge} ${b.cls}`}>
          <Icon size={14} aria-hidden="true" />
          {b.text}
        </span>
      </div>

      <div className={styles.outboxGrid}>
        <div className={`${styles.outboxTile} ${styles.outboxTilePending}`}>
          <div className={styles.outboxTileValue}>{outbox.pending}</div>
          <div className={styles.outboxTileLabel}>{t('outbox_panel.dang_cho')}</div>
        </div>
        <div className={`${styles.outboxTile} ${styles.outboxTileSending}`}>
          <div className={styles.outboxTileValue}>{outbox.sending}</div>
          <div className={styles.outboxTileLabel}>{t('outbox_panel.dang_gui')}</div>
        </div>
        <div className={`${styles.outboxTile} ${styles.outboxTileSent}`}>
          <div className={styles.outboxTileValue}>{outbox.sent}</div>
          <div className={styles.outboxTileLabel}>{t('outbox_panel.da_gui')}</div>
        </div>
        <div className={`${styles.outboxTile} ${styles.outboxTileFailed}`}>
          <div className={styles.outboxTileValue}>{outbox.failed}</div>
          <div className={styles.outboxTileLabel}>{t('outbox_panel.loi')}</div>
        </div>
      </div>

      <div className={styles.outboxOldest}>
        {t('outbox_panel.oldest', { age: formatAge(outbox.oldest_pending_age_sec) })}
      </div>
    </div>
  );
}
