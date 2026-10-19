// SPDX-License-Identifier: Apache-2.0
// AiSuggestion (C4.6): hiển thị gợi ý AI (danh mục, ưu tiên, độ tin cậy); chỉ gợi ý + nút Áp dụng khi chưa tự điền.

import { Sparkles } from 'lucide-react';
import type { AiClassifyResult } from '../../lib/api';
import { categoryMeta, priorityMeta } from '../../lib/ticket-meta';
import { Button } from '../ui/Button';
import styles from './Tickets.module.css';
import { t } from '../../lib/i18n';

export const AUTO_APPLY_CONFIDENCE = 0.7;

export function AiSuggestion({ result, applied, onApply }: { result: AiClassifyResult; applied: boolean; onApply: () => void }) {
  const pct = Math.round(result.confidence * 100);
  return (
    <div className={styles.ai} role="status">
      <Sparkles size={18} aria-hidden="true" />
      <div className={styles.aiBody}>
        <strong>
          {t('ai_suggestion.headline', { category: categoryMeta(result.category).label, priority: priorityMeta(result.priority).label })}
        </strong>
        <span className={styles.muted}>{t('ai_suggestion.confidence', { pct })}{result.reasoning ? ` — ${result.reasoning}` : ''}</span>
        {applied ? (
          <span className={styles.muted}>{t('ai_suggestion.da_tu_dien_vao_form_ban_van_co_the')}</span>
        ) : (
          <Button variant="secondary" size="sm" onClick={onApply}>
            {t('ai_suggestion.ap_dung_goi_y')}
          </Button>
        )}
      </div>
    </div>
  );
}
