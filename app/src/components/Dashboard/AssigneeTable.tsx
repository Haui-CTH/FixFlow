// DX-FSM Dashboard – Top assignees table (B6.9): cột sắp xếp được, avatar, thanh tải; mobile -> card (CSS)
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import styles from '../../pages/Dashboard.module.css';
import type { TopAssignee } from '../../lib/api';

interface AssigneeTableProps {
  assignees: TopAssignee[];
}

type Key = 'active' | 'resolved' | 'total';
const value = (a: TopAssignee, k: Key) =>
  k === 'active' ? a.active_tickets : k === 'resolved' ? a.resolved_tickets : a.active_tickets + a.resolved_tickets;

const COLS: { key: Key; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'total', label: 'Total' },
];

export function AssigneeTable({ assignees }: AssigneeTableProps) {
  const [sort, setSort] = useState<{ key: Key; dir: 'asc' | 'desc' } | null>(null);

  if (assignees.length === 0) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Assignees</h2>
        <div className={styles.empty}>No assignees yet</div>
      </div>
    );
  }

  const rows = sort
    ? [...assignees].sort((a, b) => (value(a, sort.key) - value(b, sort.key)) * (sort.dir === 'asc' ? 1 : -1))
    : assignees;
  const maxActive = Math.max(1, ...assignees.map((a) => a.active_tickets));
  const toggle = (key: Key) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Top Assignees (last {assignees.length})</h2>
      <table className={styles.assigneeTable}>
        <thead>
          <tr>
            <th scope="col">Technician</th>
            {COLS.map((c) => {
              const active = sort?.key === c.key;
              const Icon = !active ? ChevronsUpDown : sort!.dir === 'asc' ? ArrowUp : ArrowDown;
              return (
                <th
                  key={c.key}
                  scope="col"
                  className={styles.assigneeCount}
                  aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button className={styles.sortBtn} onClick={() => toggle(c.key)}>
                    {c.label}
                    <Icon size={14} aria-hidden="true" />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const total = a.active_tickets + a.resolved_tickets;
            const name = a.full_name || a.username || a.user_id.slice(0, 8);
            return (
              <tr key={a.user_id}>
                <td>
                  <div className={styles.assigneeCell}>
                    <span className={styles.avatar} aria-hidden="true">
                      {name.charAt(0)}
                    </span>
                    <div>
                      <div className={styles.assigneeName}>{name}</div>
                      {a.username && a.full_name && <div className={styles.assigneeUsername}>@{a.username}</div>}
                      <div className={styles.loadBar} aria-hidden="true">
                        <div className={styles.loadFill} style={{ width: `${(a.active_tickets / maxActive) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </td>
                <td className={styles.assigneeCount} data-label="Active">
                  <span className={a.active_tickets > 0 ? styles.numActive : styles.numZero}>{a.active_tickets}</span>
                </td>
                <td className={styles.assigneeCount} data-label="Resolved">
                  <span className={a.resolved_tickets > 0 ? styles.numResolved : styles.numZero}>{a.resolved_tickets}</span>
                </td>
                <td className={styles.assigneeCount} data-label="Total">
                  {total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
