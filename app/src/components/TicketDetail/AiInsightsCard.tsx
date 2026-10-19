// SPDX-License-Identifier: Apache-2.0
// AiInsightsCard (P5.12): phân loại AI + độ tin cậy + khuyến nghị; không chặn quy trình khi thiếu dữ liệu AI.

import { Sparkles } from 'lucide-react';
import type { Ticket } from '../../lib/api';
import { categoryMeta, priorityMeta } from '../../lib/ticket-meta';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import styles from './TicketDetail.module.css';

export function AiInsightsCard({ ticket, canSuggest, onSuggest }: { ticket: Ticket; canSuggest: boolean; onSuggest: () => void }) {
  const has = ticket.ai_category || ticket.ai_priority;
  // BE lưu confidence theo thang 0–100 hoặc 0–1
  const raw = ticket.ai_confidence ?? 0;
  const pct = Math.round(raw > 1 ? raw : raw * 100);
  return (
    <Card className={has ? undefined : styles.dim}>
      <h2 className={styles.h2}>
        <Sparkles size={16} aria-hidden="true" /> AI Insights
      </h2>
      {has ? (
        <>
          <p>
            Danh mục: <strong>{ticket.ai_category ? categoryMeta(ticket.ai_category).label : '-'}</strong>
          </p>
          <p>
            Ưu tiên: <strong>{ticket.ai_priority ? priorityMeta(ticket.ai_priority).label : '-'}</strong>
          </p>
          <div className={styles.confRow}>
            <span>Độ tin cậy</span>
            <div role="progressbar" aria-label="Độ tin cậy AI" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={styles.slaTrack}>
              <div className={`${styles.slaBar} ${styles['bar-ok']}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="tabular">{pct}%</span>
          </div>
          {ticket.ai_recommendation && <p className={styles.muted}>{ticket.ai_recommendation}</p>}
        </>
      ) : (
        <p className={styles.muted}>Chưa có phân tích AI cho ticket này. Bạn vẫn xử lý bình thường.</p>
      )}
      {canSuggest && (
        <Button variant="secondary" size="sm" onClick={onSuggest}>
          Gợi ý kỹ thuật viên
        </Button>
      )}
    </Card>
  );
}
