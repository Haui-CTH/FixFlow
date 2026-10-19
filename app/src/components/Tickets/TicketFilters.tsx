// SPDX-License-Identifier: Apache-2.0
// TicketFilters (T3.2): tìm kiếm + lọc status/priority/category + sắp xếp + chip đang bật.
// ponytail: dropdown chọn một giá trị (BE lọc 1 giá trị/trường); đa chọn cần đổi BE sang `status IN`.

import { Search, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { CATEGORY_META, CATEGORY_VALUES, PRIORITY_META, PRIORITY_VALUES, STATUS_META, STATUS_VALUES } from '../../lib/ticket-meta';
import styles from './Tickets.module.css';

export interface Filters {
  q: string;
  status: string;
  priority: string;
  category: string;
}

export const SORT_PRESETS: { value: string; label: string }[] = [
  { value: 'created_at:desc', label: 'Mới nhất' },
  { value: 'priority:desc', label: 'Ưu tiên cao trước' },
  { value: 'sla_deadline:asc', label: 'SLA gần hết hạn trước' },
];

interface Props {
  filters: Filters;
  sort: string; // "by:dir"
  onChange: (patch: Partial<Filters>) => void;
  onSort: (value: string) => void;
  onClear: () => void;
}

const DROPS: { key: 'status' | 'priority' | 'category'; label: string; values: string[]; meta: Record<string, { label: string }> }[] = [
  { key: 'status', label: 'Trạng thái', values: STATUS_VALUES, meta: STATUS_META },
  { key: 'priority', label: 'Ưu tiên', values: PRIORITY_VALUES, meta: PRIORITY_META },
  { key: 'category', label: 'Danh mục', values: CATEGORY_VALUES, meta: CATEGORY_META },
];

export function TicketFilters({ filters, sort, onChange, onSort, onClear }: Props) {
  const chips = DROPS.filter((d) => filters[d.key]).map((d) => ({
    key: d.key,
    text: `${d.label}: ${d.meta[filters[d.key]]?.label ?? filters[d.key]}`,
  }));
  if (filters.q) chips.unshift({ key: 'q' as 'status', text: `Tìm: ${filters.q}` });

  return (
    <div className={styles.toolbar} role="search">
      <div className={styles.toolbarRow}>
        <div className={styles.searchBox}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Tìm theo tiêu đề"
            aria-label="Tìm ticket theo tiêu đề"
          />
        </div>
        {DROPS.map((d) => (
          <select
            key={d.key}
            className={styles.select}
            aria-label={d.label}
            value={filters[d.key]}
            onChange={(e) => onChange({ [d.key]: e.target.value })}
          >
            <option value="">{d.label}: tất cả</option>
            {d.values.map((v) => (
              <option key={v} value={v}>
                {d.meta[v]?.label ?? v}
              </option>
            ))}
          </select>
        ))}
        <select className={styles.select} aria-label="Sắp xếp" value={sort} onChange={(e) => onSort(e.target.value)}>
          {SORT_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          {!SORT_PRESETS.some((p) => p.value === sort) && <option value={sort}>Tuỳ chỉnh (theo cột)</option>}
        </select>
      </div>
      {chips.length > 0 && (
        <div className={styles.chips}>
          {chips.map((c) => (
            <span key={c.key} className={styles.chip}>
              {c.text}
              <button aria-label={`Bỏ lọc ${c.text}`} onClick={() => onChange({ [c.key]: '' })}>
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="sm" onClick={onClear}>
            Xoá lọc
          </Button>
        </div>
      )}
    </div>
  );
}
