// SPDX-License-Identifier: Apache-2.0
// TicketFilters (T3.2): tìm kiếm + lọc status/priority/category + sắp xếp + chip đang bật.
// ponytail: dropdown chọn một giá trị (BE lọc 1 giá trị/trường); đa chọn cần đổi BE sang `status IN`.

import { Search, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { CATEGORY_META, CATEGORY_VALUES, PRIORITY_META, PRIORITY_VALUES, STATUS_META, STATUS_VALUES } from '../../lib/ticket-meta';
import styles from './Tickets.module.css';
import { t } from '../../lib/i18n';

export interface Filters {
  q: string;
  status: string;
  priority: string;
  category: string;
}

export const sortPresets = (): { value: string; label: string }[] => [
  { value: 'created_at:desc', label: t('ticket_filters.moi_nhat') },
  { value: 'priority:desc', label: t('ticket_filters.uu_tien_cao_truoc') },
  { value: 'sla_deadline:asc', label: t('ticket_filters.sla_gan_het_han_truoc') },
];

interface Props {
  filters: Filters;
  sort: string; // "by:dir"
  onChange: (patch: Partial<Filters>) => void;
  onSort: (value: string) => void;
  onClear: () => void;
}

const drops = (): { key: 'status' | 'priority' | 'category'; label: string; values: string[]; meta: Record<string, { label: string }> }[] => [
  { key: 'status', label: t('ticket_filters.trang_thai'), values: STATUS_VALUES, meta: STATUS_META },
  { key: 'priority', label: t('ticket_filters.uu_tien'), values: PRIORITY_VALUES, meta: PRIORITY_META },
  { key: 'category', label: t('ticket_filters.danh_muc'), values: CATEGORY_VALUES, meta: CATEGORY_META },
];

export function TicketFilters({ filters, sort, onChange, onSort, onClear }: Props) {
  const chips = drops().filter((d) => filters[d.key]).map((d) => ({
    key: d.key,
    text: `${d.label}: ${d.meta[filters[d.key]]?.label ?? filters[d.key]}`,
  }));
  if (filters.q) chips.unshift({ key: 'q' as 'status', text: t('ticket_filters.search_chip', { q: filters.q }) });

  return (
    <div className={styles.toolbar} role="search">
      <div className={styles.toolbarRow}>
        <div className={styles.searchBox}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder={t('ticket_filters.tim_theo_tieu_de')}
            aria-label={t('ticket_filters.tim_ticket_theo_tieu_de')}
          />
        </div>
        {drops().map((d) => (
          <select
            key={d.key}
            className={styles.select}
            aria-label={d.label}
            value={filters[d.key]}
            onChange={(e) => onChange({ [d.key]: e.target.value })}
          >
            <option value="">{t('ticket_filters.all_of', { label: d.label })}</option>
            {d.values.map((v) => (
              <option key={v} value={v}>
                {d.meta[v]?.label ?? v}
              </option>
            ))}
          </select>
        ))}
        <select className={styles.select} aria-label={t('ticket_filters.sap_xep')} value={sort} onChange={(e) => onSort(e.target.value)}>
          {sortPresets().map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          {!sortPresets().some((p) => p.value === sort) && <option value={sort}>{t('ticket_filters.tuy_chinh_theo_cot')}</option>}
        </select>
      </div>
      {chips.length > 0 && (
        <div className={styles.chips}>
          {chips.map((c) => (
            <span key={c.key} className={styles.chip}>
              {c.text}
              <button aria-label={t('ticket_filters.remove_filter', { text: c.text })} onClick={() => onChange({ [c.key]: '' })}>
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="sm" onClick={onClear}>
            {t('ticket_filters.xoa_loc')}
          </Button>
        </div>
      )}
    </div>
  );
}
