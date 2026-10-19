// SPDX-License-Identifier: Apache-2.0
// DX-FSM Dashboard Page (GĐ 06): KPI, phân bố, SLA, hoạt động 24h, Outbox, top KTV.
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, BarChart3, Gauge, RefreshCw, Ticket } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ActivityPanel } from '../components/Dashboard/ActivityPanel';
import { AssigneeTable } from '../components/Dashboard/AssigneeTable';
import { DistributionBar } from '../components/Dashboard/DistributionBar';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { OutboxPanel } from '../components/Dashboard/OutboxPanel';
import { SLAPanel } from '../components/Dashboard/SLAPanel';
import { Button } from '../components/ui/Button';
import { SkeletonBlock } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { metricsApi, type StatusCount } from '../lib/api';
import { categoryMeta, priorityMeta, statusMeta, type Tone } from '../lib/ticket-meta';
import styles from './Dashboard.module.css';
import { locale, t } from '../lib/i18n';

const WINDOW_DAYS_OPTIONS = [7, 30, 90, 365];
const DEFAULT_DAYS = 30;

// tone nghiệp vụ -> màu thanh (một nguồn: lib/ticket-meta.ts)
const FILL: Record<Tone, 'blue' | 'yellow' | 'green' | 'red' | 'gray' | 'purple'> = {
  info: 'blue',
  assigned: 'purple',
  warning: 'yellow',
  muted: 'gray',
  success: 'green',
  dark: 'gray',
  danger: 'red',
};

// ─── Main Dashboard ──────────────────────────────────────

export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get('days'));
  const windowDays = WINDOW_DAYS_OPTIONS.includes(requested) ? requested : DEFAULT_DAYS;
  const setDays = (d: number) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (d === DEFAULT_DAYS) n.delete('days');
        else n.set('days', String(d));
        return n;
      },
      { replace: true },
    );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-metrics', windowDays],
    queryFn: () => metricsApi.get({ window_days: windowDays }).then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className={styles.dashboard}>
      {/* ─── Header ──────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('dashboard.tong_quan_van_hanh')}</h1>
          <div className={styles.subtitle}>
            {t('dashboard.subtitle', { days: windowDays })}
            {data && (
              <span className={styles.refreshed}>
                {' '}
                · {t('dashboard.updated_at', { time: new Date(data.generated_at).toLocaleTimeString(locale()) })}
              </span>
            )}
          </div>
        </div>
        <div className={styles.windowSelector}>
          <div role="radiogroup" aria-label={t('dashboard.khoang_thoi_gian')} className={styles.segmented}>
            {WINDOW_DAYS_OPTIONS.map((d) => (
              <label key={d}>
                <input
                  type="radio"
                  name="window"
                  value={d}
                  checked={d === windowDays}
                  onChange={() => setDays(d)}
                  className="sr-only"
                />
                {t('dashboard.days', { count: d })}
              </label>
            ))}
          </div>
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching && !isLoading} aria-label={t('dashboard.lam_moi_so_lieu')}>
            {!isFetching && <RefreshCw size={16} aria-hidden="true" />}
            {t('dashboard.lam_moi')}
          </Button>
        </div>
      </div>

      {/* ─── Error state ────────────────────────────── */}
      {isError && !data && <ErrorState title={t('dashboard.khong_tai_duoc_so_lieu')} message={t('dashboard.kiem_tra_ket_noi_roi_thu_lai')} onRetry={() => refetch()} />}

      {/* ─── Loading state ──────────────────────────── */}
      {isLoading && (
        <div className={styles.skelGrid} role="status" aria-label={t('dashboard.dang_tai_so_lieu')}>
          <div className={styles.statGrid}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} height={96} />
            ))}
          </div>
          <SkeletonBlock height={220} />
          <SkeletonBlock height={220} />
        </div>
      )}

      {/* ─── Empty state ────────────────────────────── */}
      {data && data.total_tickets === 0 && (
        <EmptyState
          icon={BarChart3}
          title={t('dashboard.empty_title', { days: windowDays })}
          description={t('dashboard.thu_chon_khoang_thoi_gian_dai_hon')}
          action={
            windowDays < 365 ? (
              <Button variant="secondary" onClick={() => setDays(365)}>
                {t('dashboard.xem_365_ngay')}
              </Button>
            ) : undefined
          }
        />
      )}

      {/* ─── Data state ─────────────────────────────── */}
      {data && data.total_tickets > 0 && (
        <>
          <div className={styles.statGrid}>
            <MetricCard icon={Ticket} label={t('dashboard.tong_ticket')} value={data.total_tickets} color="blue" />
            <MetricCard icon={Activity} label={t('dashboard.dang_xu_ly')} value={data.sla.total_active} color="purple" />
            <MetricCard
              icon={Gauge}
              label={t('dashboard.ti_le_vi_pham_sla')}
              value={`${(data.sla.breach_rate * 100).toFixed(1)}%`}
              color={data.sla.breach_rate >= 0.25 ? 'red' : data.sla.breach_rate >= 0.1 ? 'yellow' : 'green'}
            />
            <MetricCard
              icon={AlertTriangle}
              label={t('dashboard.outbox_loi')}
              value={data.outbox.failed}
              hint={t('dashboard.outbox_pending', { count: data.outbox.pending })}
              color={data.outbox.failed > 0 ? 'red' : data.outbox.pending > 0 ? 'yellow' : 'green'}
            />
          </div>

          <div className={styles.sectionGrid}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('dashboard.theo_trang_thai')}</h2>
              {data.by_status.map((s: StatusCount) => (
                <DistributionBar
                  key={s.status}
                  label={statusMeta(s.status).label}
                  count={s.count}
                  total={data.total_tickets}
                  color={FILL[statusMeta(s.status).tone]}
                />
              ))}
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('dashboard.theo_muc_uu_tien')}</h2>
              {data.by_priority.map((p) => (
                <DistributionBar
                  key={p.priority}
                  label={priorityMeta(p.priority).label}
                  count={p.count}
                  total={data.total_tickets}
                  color={FILL[priorityMeta(p.priority).tone]}
                />
              ))}
            </div>
          </div>

          <div className={styles.sectionGrid}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('dashboard.theo_danh_muc')}</h2>
              {data.by_category.map((c) => (
                <DistributionBar
                  key={c.category}
                  label={categoryMeta(c.category).label}
                  count={c.count}
                  total={data.total_tickets}
                  color={FILL[categoryMeta(c.category).tone]}
                />
              ))}
            </div>
            <SLAPanel sla={data.sla} />
          </div>

          <div className={styles.sectionGrid}>
            <ActivityPanel activity={data.activity} />
            <OutboxPanel outbox={data.outbox} />
          </div>

          <AssigneeTable assignees={data.top_assignees} />
        </>
      )}
    </div>
  );
}
