// SPDX-License-Identifier: Apache-2.0
// TicketTable (T3.5) — bảng (≥768) và danh sách card (<768); header cột sắp xếp được với aria-sort.

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Ticket } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { PriorityBadge, StatusBadge } from '../ui/Badge';
import { SlaCountdown } from './SlaCountdown';
import styles from './Tickets.module.css';

export interface Sort {
  by: string;
  dir: 'asc' | 'desc';
}

const COLUMNS: { key: string; label: string; sortBy?: string }[] = [
  { key: 'code', label: 'Mã' },
  { key: 'title', label: 'Tiêu đề' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'priority', label: 'Ưu tiên', sortBy: 'priority' },
  { key: 'tech', label: 'KTV' },
  { key: 'sla', label: 'SLA', sortBy: 'sla_deadline' },
  { key: 'created', label: 'Ngày tạo', sortBy: 'created_at' },
];

function Tech({ name }: { name?: string | null }) {
  if (!name) return <span className={styles.muted}>Chưa giao</span>;
  return (
    <span className={styles.tech}>
      <span className={styles.avatar} aria-hidden="true">
        {name.charAt(0)}
      </span>
      {name}
    </span>
  );
}

export function TicketTable({
  tickets,
  sort,
  onSort,
  now,
}: {
  tickets: Ticket[];
  sort: Sort;
  onSort: (sortBy: string) => void;
  now: number;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map((c) => {
              const active = c.sortBy === sort.by;
              const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={c.sortBy ? (active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                >
                  {c.sortBy ? (
                    <button className={styles.sortBtn} onClick={() => onSort(c.sortBy!)}>
                      {c.label}
                      <Icon size={14} aria-hidden="true" />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>
                <Link to={`/tickets/${t.id}`} className={styles.code}>
                  {t.ticket_number}
                </Link>
              </td>
              <td className={styles.titleCell}>{t.title}</td>
              <td>
                <StatusBadge status={t.status} />
              </td>
              <td>
                <PriorityBadge priority={t.priority} />
              </td>
              <td>
                <Tech name={t.technician_name} />
              </td>
              <td>
                <SlaCountdown ticket={t} now={now} />
              </td>
              <td className={styles.dateText}>{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
