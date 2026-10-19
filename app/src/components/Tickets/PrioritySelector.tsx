// SPDX-License-Identifier: Apache-2.0
// PrioritySelector (C4.5): radiogroup dạng thẻ, icon + chữ + thời gian xử lý (SLA). Mũi tên chuyển lựa chọn (radio native).

import { PRIORITY_META, PRIORITY_VALUES } from '../../lib/ticket-meta';
import styles from './Tickets.module.css';
import { t } from '../../lib/i18n';

// Khớp SLA_HOURS ở BE (routes/tickets.py)
const slaHint = (): Record<string, string> => ({
  low: t('priority_selector.xu_ly_trong_7_ngay'),
  medium: t('priority_selector.xu_ly_trong_3_ngay'),
  high: t('priority_selector.xu_ly_trong_24_gio'),
  critical: t('priority_selector.xu_ly_trong_4_gio'),
});

interface Props {
  value: string;
  onChange: (v: string) => void;
  name?: string;
  error?: string;
}

export function PrioritySelector({ value, onChange, name = 'priority', error }: Props) {
  return (
    <div role="radiogroup" aria-label={t('priority_selector.muc_uu_tien')} aria-invalid={error ? true : undefined} className={styles.prioGroup}>
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
            <span className={styles.prioHint}>{slaHint()[p]}</span>
          </label>
        );
      })}
    </div>
  );
}
