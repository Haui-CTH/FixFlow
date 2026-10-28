// SPDX-License-Identifier: Apache-2.0
// AiInsightsCard (P5.12): phân loại AI + độ tin cậy + khuyến nghị; không chặn quy trình khi thiếu dữ liệu AI.

import { Sparkles } from 'lucide-react';
import type { Ticket } from '../../lib/api';
import { categoryMeta, priorityMeta } from '../../lib/ticket-meta';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import styles from './TicketDetail.module.css';
import { t } from '../../lib/i18n';

export function AiInsightsCard({ ticket, canSuggest, onSuggest }: { ticket: Ticket; canSuggest: boolean; onSuggest: () => void }) {
  const has = ticket.ai_category || ticket.ai_priority;
  // BE lưu confidence theo thang 0–100 hoặc 0–1
  const raw = ticket.ai_confidence ?? 0;
  const pct = Math.round(raw > 1 ? raw : raw * 100);
  return (
    <Card className={has ? undefined : styles.dim}>
      <h2 className={styles.h2}>
        <Sparkles size={16} aria-hidden="true" /> Chuẩn đoán & Hỗ trợ Kỹ thuật
      </h2>
      {has ? (
        <>
          <p>
            {t('ai_insights_card.category')}: <strong>{ticket.ai_category ? categoryMeta(ticket.ai_category).label : '-'}</strong>
          </p>
          <p>
            {t('ai_insights_card.priority')}: <strong>{ticket.ai_priority ? priorityMeta(ticket.ai_priority).label : '-'}</strong>
          </p>
          <div className={styles.confRow}>
            <span>{t('ai_insights_card.do_tin_cay')}</span>
            <div role="progressbar" aria-label={t('ai_insights_card.do_tin_cay_ai')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={styles.slaTrack}>
              <div className={`${styles.slaBar} ${styles['bar-ok']}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="tabular">{pct}%</span>
          </div>
          {ticket.ai_recommendation && <p className={styles.muted}>{ticket.ai_recommendation}</p>}
        </>
      ) : (
        <p className={styles.muted}>{t('ai_insights_card.chua_co_phan_tich_ai_cho_ticket_na')}</p>
      )}
      {canSuggest && (
        <Button variant="secondary" size="sm" onClick={onSuggest}>
          {t('ai_insights_card.goi_y_ky_thuat_vien')}
        </Button>
      )}
    </Card>
  );
}
