// SPDX-License-Identifier: Apache-2.0
// DX-FSM Dashboard Page (F5.1 — wire /admin/metrics)
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { metricsApi, type StatusCount } from '../lib/api';
import { priorityMeta, statusMeta } from '../lib/ticket-meta';
import styles from './Dashboard.module.css';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { DistributionBar } from '../components/Dashboard/DistributionBar';
import { SLAPanel } from '../components/Dashboard/SLAPanel';
import { OutboxPanel } from '../components/Dashboard/OutboxPanel';
import { AssigneeTable } from '../components/Dashboard/AssigneeTable';

const WINDOW_DAYS_OPTIONS = [7, 30, 90, 365];

// ─── Color helpers ───────────────────────────────────────

const STATUS_COLOR: Record<string, 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple'> = {
  new: 'blue',
  assigned: 'purple',
  in_progress: 'yellow',
  pending: 'gray',
  resolved: 'green',
  closed: 'green',
  cancelled: 'red',
  sla_breached: 'red',
};

const PRIORITY_COLOR: Record<string, 'blue' | 'yellow' | 'orange' | 'red' | 'green' | 'gray'> = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  urgent: 'red',
};

const CATEGORY_COLOR: Record<string, 'blue' | 'yellow' | 'orange' | 'red' | 'green' | 'gray' | 'purple'> = {
  hardware: 'gray',
  software: 'blue',
  network: 'purple',
  electrical: 'yellow',
  plumbing: 'blue',
  hvac: 'orange',
  other: 'gray',
};

// ─── Main Dashboard ──────────────────────────────────────

export default function Dashboard() {
  const [windowDays, setWindowDays] = useState(30);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-metrics', windowDays],
    queryFn: () => metricsApi.get({ window_days: windowDays }).then((r) => r.data),
    staleTime: 30_000, // 30s
    refetchOnWindowFocus: false,
  });

  return (
    <div className={styles.dashboard}>
      {/* ─── Header ──────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <div className={styles.subtitle}>
            Last 24h activity + {windowDays}-day window
            {data && (
              <span className={styles.refreshed}>
                {' '}· refreshed {new Date(data.generated_at).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className={styles.windowSelector}>
          <label htmlFor="window-select">Window:</label>
          <select
            id="window-select"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          >
            {WINDOW_DAYS_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d === 365 ? '1 year' : `${d} days`}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              padding: '0.375rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              background: 'white',
              cursor: isFetching ? 'wait' : 'pointer',
              fontSize: '0.875rem',
              color: '#374151',
            }}
            aria-label="Refresh metrics"
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ─── Error state ────────────────────────────── */}
      {isError && (
        <div className={styles.errorBox}>
          <span>Failed to load metrics: {(error as Error)?.message || 'Unknown error'}</span>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {/* ─── Loading state ──────────────────────────── */}
      {isLoading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
          <div>Loading dashboard…</div>
        </div>
      )}

      {/* ─── Data state ─────────────────────────────── */}
      {data && (
        <>
          {/* Top stat cards */}
          <div className={styles.statGrid}>
            <MetricCard
              label="Tổng ticket"
              value={data.total_tickets}
              color="blue"
            />
            <MetricCard
              label="Mới (24h)"
              value={data.activity.last_24h_created}
              color="purple"
            />
            <MetricCard
              label="Resolved (24h)"
              value={data.activity.last_24h_resolved}
              color="green"
            />
            <MetricCard
              label="Breached (24h)"
              value={data.activity.last_24h_breached}
              color={data.activity.last_24h_breached > 0 ? 'red' : 'gray'}
            />
          </div>

          {/* By status + By priority side-by-side */}
          <div className={styles.sectionGrid}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Theo trạng thái</h2>
              {data.by_status.length === 0 ? (
                <div className={styles.empty}>No tickets yet</div>
              ) : (
                data.by_status.map((s: StatusCount) => (
                  <DistributionBar
                    key={s.status}
                    label={statusMeta(s.status).label}
                    count={s.count}
                    total={data.total_tickets}
                    color={STATUS_COLOR[s.status] || 'gray'}
                  />
                ))
              )}
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Theo priority</h2>
              {data.by_priority.length === 0 ? (
                <div className={styles.empty}>No tickets yet</div>
              ) : (
                data.by_priority.map((p) => (
                  <DistributionBar
                    key={p.priority}
                    label={priorityMeta(p.priority).label}
                    count={p.count}
                    total={data.total_tickets}
                    color={PRIORITY_COLOR[p.priority] || 'gray'}
                  />
                ))
              )}
            </div>
          </div>

          {/* By category + SLA side-by-side */}
          <div className={styles.sectionGrid}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Theo category</h2>
              {data.by_category.length === 0 ? (
                <div className={styles.empty}>No tickets yet</div>
              ) : (
                data.by_category.map((c) => (
                  <DistributionBar
                    key={c.category}
                    label={c.category}
                    count={c.count}
                    total={data.total_tickets}
                    color={CATEGORY_COLOR[c.category] || 'gray'}
                  />
                ))
              )}
            </div>

            <SLAPanel sla={data.sla} />
          </div>

          {/* Outbox + Top assignees side-by-side */}
          <div className={styles.sectionGrid}>
            <OutboxPanel outbox={data.outbox} />
            <AssigneeTable assignees={data.top_assignees} />
          </div>
        </>
      )}
    </div>
  );
}
