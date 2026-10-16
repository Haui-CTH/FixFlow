// DX-FSM Dashboard – Top assignees table
import styles from '../../pages/Dashboard.module.css';
import type { TopAssignee } from '../../lib/api';

interface AssigneeTableProps {
  assignees: TopAssignee[];
}

export function AssigneeTable({ assignees }: AssigneeTableProps) {
  if (assignees.length === 0) {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Assignees</h2>
        <div className={styles.empty}>No assignees yet</div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Top Assignees (last {assignees.length})</h2>
      <table className={styles.assigneeTable}>
        <thead>
          <tr>
            <th>Technician</th>
            <th className={styles.assigneeCount}>Active</th>
            <th className={styles.assigneeCount}>Resolved</th>
            <th className={styles.assigneeCount}>Total</th>
          </tr>
        </thead>
        <tbody>
          {assignees.map((a) => {
            const total = a.active_tickets + a.resolved_tickets;
            const name = a.full_name || a.username || a.user_id.slice(0, 8);
            return (
              <tr key={a.user_id}>
                <td>
                  <div className={styles.assigneeName}>{name}</div>
                  {a.username && a.full_name && (
                    <div className={styles.assigneeUsername}>@{a.username}</div>
                  )}
                </td>
                <td className={styles.assigneeCount}>
                  <span style={{ color: a.active_tickets > 0 ? '#3b82f6' : '#9ca3af' }}>
                    {a.active_tickets}
                  </span>
                </td>
                <td className={styles.assigneeCount}>
                  <span style={{ color: a.resolved_tickets > 0 ? '#10b981' : '#9ca3af' }}>
                    {a.resolved_tickets}
                  </span>
                </td>
                <td className={styles.assigneeCount}>{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
