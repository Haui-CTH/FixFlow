// SPDX-License-Identifier: Apache-2.0
// Hooks thông báo (N7.1, N7.8): danh sách cho chuông (poll 60s), mark read/all với cập nhật lạc quan, toast khi có thông báo mới.

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { notificationsApi, type Notification, type NotificationsListResponse } from '../lib/notifications';
import { toastApi } from '../lib/toast';

export const POLL_MS = 60_000;

// Cập nhật mọi danh sách thông báo đang có trong cache (bell + trang)
function patchLists(qc: QueryClient, fn: (n: Notification) => Notification, unreadDelta: (before: Notification[], after: Notification[]) => number) {
  qc.setQueriesData<NotificationsListResponse>({ queryKey: ['notifications'] }, (old) => {
    if (!old?.items) return old;
    const items = old.items.map(fn);
    return { ...old, items, unread_count: Math.max(0, old.unread_count + unreadDelta(old.items, items)) };
  });
}
const unreadOf = (l: Notification[]) => l.filter((n) => !n.is_read).length;

export function useNotificationActions() {
  const qc = useQueryClient();
  const snapshot = () => qc.getQueriesData<NotificationsListResponse>({ queryKey: ['notifications'] });
  const restore = (snap: ReturnType<typeof snapshot>) => snap.forEach(([k, v]) => qc.setQueryData(k, v));

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const snap = snapshot();
      patchLists(qc, (n) => (n.id === id ? { ...n, is_read: true } : n), (a, b) => unreadOf(b) - unreadOf(a));
      return { snap };
    },
    onError: (_e, _id, ctx) => ctx && restore(ctx.snap),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['notifications'] });
      const snap = snapshot();
      patchLists(qc, (n) => ({ ...n, is_read: true }), (a, b) => unreadOf(b) - unreadOf(a));
      return { snap };
    },
    onError: (_e, _v, ctx) => ctx && restore(ctx.snap),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return { markRead, markAll };
}

// Chuông: 10 thông báo gần nhất + số chưa đọc; poll 60s (tạm dừng khi tab ẩn)
export function useNotificationBell() {
  const query = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => notificationsApi.list({ limit: 10 }),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  });

  // Toast: tối đa 1 lần mỗi lần poll, gộp số lượng; không toast ở lần tải đầu
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const items = query.data?.items;
    if (!items) return;
    if (seen.current === null) {
      seen.current = new Set(items.map((n) => n.id));
      return;
    }
    const fresh = items.filter((n) => !n.is_read && !seen.current!.has(n.id));
    items.forEach((n) => seen.current!.add(n.id));
    if (fresh.length === 1) toastApi.info(fresh[0].title, 'Thông báo mới');
    else if (fresh.length > 1) toastApi.info(`Có ${fresh.length} thông báo mới`);
  }, [query.data]);

  return { ...query, items: query.data?.items ?? [], unread: query.data?.unread_count ?? 0 };
}
