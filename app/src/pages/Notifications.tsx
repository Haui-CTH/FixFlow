// SPDX-License-Identifier: Apache-2.0
// DX-FSM Notifications Center Page (F5.2)
// List notifications với filter (all/unread), mark as read, navigate to ticket.

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationsApi,
  type Notification,
} from '../lib/notifications';
import { NotificationItem } from '../components/Notifications/NotificationItem';
import styles from './Notifications.module.css';

type Filter = 'all' | 'unread';

const PAGE_SIZE = 20;

export default function Notifications() {
  const [filter, setFilter] = useState<Filter>('all');
  const [offset, setOffset] = useState(0);
  const queryClient = useQueryClient();

  // ─── List query ─────────────────────────────────────
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications', filter, offset],
    queryFn: () =>
      notificationsApi.list({
        is_read: filter === 'unread' ? false : undefined,
        limit: PAGE_SIZE,
        offset,
      }),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  // ─── Mark single as read mutation ───────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData(['notifications', filter, offset]);
      queryClient.setQueryData(['notifications', filter, offset], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((n: Notification) =>
            n.id === id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          ),
          unread_count: Math.max(0, old.unread_count - 1),
        };
      });
      return { previous };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['notifications', filter, offset], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // ─── Mark all as read mutation ──────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const unreadCount = data?.unread_count ?? 0;
  const hasNext = offset + PAGE_SIZE < total;
  const hasPrev = offset > 0;

  return (
    <div className={styles.page}>
      {/* ─── Header ─────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Notifications
          <span
            className={`${styles.unreadBadge} ${unreadCount === 0 ? styles.unreadBadgeEmpty : ''}`}
            aria-label={`${unreadCount} unread`}
          >
            {unreadCount}
          </span>
        </h1>
        <div className={styles.actions}>
          <button
            className={styles.markAllBtn}
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? 'Marking…' : 'Mark all as read'}
          </button>
        </div>
      </div>

      {/* ─── Error state ────────────────────────────── */}
      {isError && (
        <div className={styles.errorBox}>
          <span>Failed to load notifications: {(error as Error)?.message || 'Unknown'}</span>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {/* ─── Filter tabs ────────────────────────────── */}
      <div className={styles.filters} role="tablist">
        <button
          className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
          onClick={() => { setFilter('all'); setOffset(0); }}
          role="tab"
          aria-selected={filter === 'all'}
        >
          All <span className={styles.filterCount}>{total}</span>
        </button>
        <button
          className={`${styles.filterTab} ${filter === 'unread' ? styles.filterTabActive : ''}`}
          onClick={() => { setFilter('unread'); setOffset(0); }}
          role="tab"
          aria-selected={filter === 'unread'}
        >
          Unread <span className={styles.filterCount}>{unreadCount}</span>
        </button>
      </div>

      {/* ─── Loading state ──────────────────────────── */}
      {isLoading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
          <div>Loading notifications…</div>
        </div>
      )}

      {/* ─── Empty state ────────────────────────────── */}
      {!isLoading && items.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            {filter === 'unread' ? '✓' : '🔔'}
          </div>
          <h2 className={styles.emptyTitle}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h2>
          <p className={styles.emptyHint}>
            {filter === 'unread'
              ? "You're all caught up!"
              : "You'll see ticket updates, SLA warnings, and system alerts here."}
          </p>
        </div>
      )}

      {/* ─── List ───────────────────────────────────── */}
      {!isLoading && items.length > 0 && (
        <div className={styles.list}>
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={(id) => markReadMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* ─── Pagination ─────────────────────────────── */}
      {total > PAGE_SIZE && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationBtn}
            disabled={!hasPrev}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            ← Previous
          </button>
          <span>
            {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <button
            className={styles.paginationBtn}
            disabled={!hasNext}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
