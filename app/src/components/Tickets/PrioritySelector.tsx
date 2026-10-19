// SPDX-License-Identifier: Apache-2.0
// PrioritySelector (C4.5): radiogroup dạng thẻ, icon + chữ + thời gian xử lý (SLA). Mũi tên chuyển lựa chọn (radio native).

import { PRIORITY_META, PRIORITY_VALUES } from '../../lib/ticket-meta';
import styles from './Tickets.module.css';

// Khớp SLA_HOURS ở BE (routes/tickets.py)
const SLA_HINT: Record<string, string> = {
  low: 'Xử lý trong 7 ngày',
  medium: 'Xử lý trong 3 ngày',
  high: 'Xử lý trong 24 giờ',
  critical: 'Xử lý trong 4 giờ',
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  name?: string;
  error?: string;
}

export function PrioritySelector({ value, onChange, name = 'priority', error }: Props) {
  return (
    <div role="radiogroup" aria-label="Mức ưu tiên" aria-invalid={error ? true : undefined} className={styles.prioGroup}>
      {PRIORITY_VALUES.map((p) => {
        const m = PRIORITY_META[p];
        const Icon = m.icon!;
        return (
          <label key={p} className={`${styles.prioCard} ${styles['prio-' + m.tone]} ${value === p ? styles.prioOn : ''}`}>
            <input type="radio" name={name} value={p} checked={value === p} onChange={() => onChange(p)} className="sr-only" />
            <span className={styles.prioTitle}>
              <Icon size={18} aria-hidden="true" />
              {m.label}
            </span>
            <span className={styles.prioHint}>{SLA_HINT[p]}</span>
          </label>
        );
      })}
    </div>
  );
}
