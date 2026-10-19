// SPDX-License-Identifier: Apache-2.0
// AiSuggestion (C4.6): hiển thị gợi ý AI (danh mục, ưu tiên, độ tin cậy); chỉ gợi ý + nút Áp dụng khi chưa tự điền.

import { Sparkles } from 'lucide-react';
import type { AiClassifyResult } from '../../lib/api';
import { categoryMeta, priorityMeta } from '../../lib/ticket-meta';
import { Button } from '../ui/Button';
import styles from './Tickets.module.css';

export const AUTO_APPLY_CONFIDENCE = 0.7;

export function AiSuggestion({ result, applied, onApply }: { result: AiClassifyResult; applied: boolean; onApply: () => void }) {
  const pct = Math.round(result.confidence * 100);
  return (
    <div className={styles.ai} role="status">
      <Sparkles size={18} aria-hidden="true" />
      <div className={styles.aiBody}>
        <strong>
          Gợi ý AI: {categoryMeta(result.category).label} · ưu tiên {priorityMeta(result.priority).label}
        </strong>
        <span className={styles.muted}>Độ tin cậy {pct}%{result.reasoning ? ` — ${result.reasoning}` : ''}</span>
        {applied ? (
          <span className={styles.muted}>Đã tự điền vào form, bạn vẫn có thể sửa.</span>
        ) : (
          <Button variant="secondary" size="sm" onClick={onApply}>
            Áp dụng gợi ý
          </Button>
        )}
      </div>
    </div>
  );
}
