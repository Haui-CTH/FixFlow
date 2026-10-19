// SPDX-License-Identifier: Apache-2.0
// DX-FSM Notifications Center Page (GĐ 07): lọc Tất cả/Chưa đọc, nhóm theo ngày, "Tải thêm".

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { BellOff } from 'lucide-react';
import { useState } from 'react';
import { NotificationItem } from '../components/Notifications/NotificationItem';
import { Button } from '../components/ui/Button';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useNotificationActions } from '../hooks/useNotifications';
import { notificationsApi, type Notification } from '../lib/notifications';
import styles from './Notifications.module.css';
import { t } from '../lib/i18n';

type Filter = 'all' | 'unread';
const PAGE = 20;

// Hôm nay / Hôm qua / Cũ hơn (theo giờ địa phương)
export function groupByDay(items: Notification[], now = new Date()): { label: string; items: Notification[] }[] {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = day(now);
  const [TODAY, YESTERDAY, OLDER] = [t('notifications.hom_nay'), t('notifications.hom_qua'), t('notifications.cu_hon')];
  const groups: Record<string, Notification[]> = { [TODAY]: [], [YESTERDAY]: [], [OLDER]: [] };
  for (const n of items) {
    const diff = Math.round((today - day(new Date(n.created_at))) / 86_400_000);
    groups[diff <= 0 ? TODAY : diff === 1 ? YESTERDAY : OLDER].push(n);
  }
  return Object.entries(groups)
    .filter(([, v]) => v.length)
    .map(([label, v]) => ({ label, items: v }));
}

export default function Notifications() {
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE);
  const { markRead, markAll } = useNotificationActions();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', 'page', filter, limit],
    queryFn: () => notificationsApi.list({ is_read: filter === 'unread' ? false : undefined, limit, offset: 0 }),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const unread = data?.unread_count ?? 0;
  const pick = (f: Filter) => {
    setFilter(f);
    setLimit(PAGE);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {t('notifications.thong_bao')}
          <span className={`${styles.unreadBadge} ${unread === 0 ? styles.unreadBadgeEmpty : ''}`} aria-label={t('notifications.unread_aria', { count: unread })}>
            {unread}
          </span>
        </h1>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => markAll.mutate()} disabled={unread === 0} loading={markAll.isPending}>
            {t('notifications.danh_dau_tat_ca_da_doc')}
          </Button>
        </div>
      </div>

      <div className={styles.filters} role="tablist" aria-label={t('notifications.loc_thong_bao')}>
        <button
          role="tab"
          aria-selected={filter === 'all'}
          className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
          onClick={() => pick('all')}
        >
          {t('notifications.tab_all')} {filter === 'all' && <span className={styles.filterCount}>{total}</span>}
        </button>
        <button
          role="tab"
          aria-selected={filter === 'unread'}
          className={`${styles.filterTab} ${filter === 'unread' ? styles.filterTabActive : ''}`}
          onClick={() => pick('unread')}
        >
          {t('notifications.tab_unread')} <span className={styles.filterCount}>{unread}</span>
        </button>
      </div>

      {isError && !data ? (
        <ErrorState title={t('notifications.khong_tai_duoc_thong_bao')} onRetry={() => refetch()} />
      ) : isLoading ? (
        <SkeletonRows rows={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={filter === 'unread' ? t('notifications.ban_da_xem_het_thong_bao') : t('notifications.chua_co_thong_bao_nao')}
          description={filter === 'unread' ? undefined : t('notifications.cap_nhat_ticket_va_canh_bao_sla_se')}
        />
      ) : (
        <>
          {groupByDay(items).map((g) => (
            <section key={g.label} className={styles.group} aria-label={g.label}>
              <h2 className={styles.groupTitle}>{g.label}</h2>
              <div className={styles.list}>
                {g.items.map((n) => (
                  <NotificationItem key={n.id} notification={n} onMarkRead={(id) => markRead.mutate(id)} />
                ))}
              </div>
            </section>
          ))}
          {items.length < total && (
            <div className={styles.more}>
              <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
                {t('notifications.tai_them')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
