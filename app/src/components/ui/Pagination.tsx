// SPDX-License-Identifier: Apache-2.0
// Pagination (T3.8): Trước/Sau + số trang, đổi kích thước trang.

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import styles from './ui.module.css';

const SIZES = [10, 20, 50];

// Danh sách trang gọn: 1 … 4 5 6 … 20
export function pageList(page: number, pages: number): (number | '…')[] {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

interface Props {
  page: number; // bắt đầu từ 1
  size: number;
  total: number;
  onPage: (p: number) => void;
  onSize: (s: number) => void;
}

export function Pagination({ page, size, total, onPage, onSize }: Props) {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(page * size, total);
  return (
    <nav className={styles.pagination} aria-label="Phân trang">
      <span className={styles.pageInfo} aria-live="polite">
        Hiển thị {from}–{to} / {total}
      </span>
      <div className={styles.pageBtns}>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Trang trước">
          <ChevronLeft size={16} aria-hidden="true" />
          Trước
        </Button>
        {pageList(page, pages).map((n, i) =>
          n === '…' ? (
            <span key={`gap${i}`} aria-hidden="true">
              …
            </span>
          ) : (
            <Button
              key={n}
              variant={n === page ? 'primary' : 'ghost'}
              size="sm"
              aria-label={`Trang ${n}`}
              aria-current={n === page ? 'page' : undefined}
              onClick={() => onPage(n)}
            >
              {n}
            </Button>
          ),
        )}
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Trang sau">
          Sau
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
      <label className={styles.pageSize}>
        Mỗi trang
        <select value={size} onChange={(e) => onSize(Number(e.target.value))}>
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
