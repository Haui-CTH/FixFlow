// SPDX-License-Identifier: Apache-2.0
// DX-FSM Notification types & API client (F5.2, GĐ 07)
// API thật: ticket-service (GET /notifications, PATCH /notifications/{id}/read, POST /notifications/mark-all-read).
// Mock (dữ liệu giả) chỉ dùng khi VITE_USE_MOCK=true hoặc khi chạy test.

import { api } from './api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'test';

// ─── Types (matches BE notification table + B5.1 response) ─────

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  ticket_id?: string | null;
  ticket_number?: string | null;
  created_at: string;
  read_at?: string | null;
}

export interface NotificationsListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

export interface MarkReadResponse {
  id: string;
  is_read: true;
  read_at: string;
}

// ─── API ─────────────────────────────────────────────────

export const notificationsApi = {
  list: async (params?: { is_read?: boolean; limit?: number; offset?: number }) => {
    if (USE_MOCK) return mockListNotifications(params);
    return api.get<NotificationsListResponse>('/notifications', { params }).then((r) => r.data);
  },

  markRead: async (id: string) => {
    if (USE_MOCK) return { id, is_read: true as const, read_at: new Date().toISOString() };
    return api.patch<MarkReadResponse>(`/notifications/${id}/read`).then((r) => r.data);
  },

  markAllRead: async () => {
    if (USE_MOCK) return { marked: 0 };
    return api.post<{ marked: number }>('/notifications/mark-all-read').then((r) => r.data);
  },
};

// ─── Mock data generator ──────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    user_id: 'u-1',
    title: 'Ticket #TKT-001 assigned to you',
    message: 'Hardware issue at ACME Corp — please review and accept',
    type: 'info',
    is_read: false,
    ticket_id: 't1',
    ticket_number: 'TKT-001',
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 'n2',
    user_id: 'u-1',
    title: 'SLA breach warning',
    message: 'Ticket #TKT-002 is approaching its 4-hour deadline (45 min remaining)',
    type: 'warning',
    is_read: false,
    ticket_id: 't2',
    ticket_number: 'TKT-002',
    created_at: new Date(Date.now() - 15 * 60_000).toISOString(),
  },
  {
    id: 'n3',
    user_id: 'u-1',
    title: 'Ticket #TKT-003 resolved',
    message: 'Customer confirmed the issue is fixed. Please close the ticket.',
    type: 'success',
    is_read: true,
    ticket_id: 't3',
    ticket_number: 'TKT-003',
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
    read_at: new Date(Date.now() - 1 * 3600_000).toISOString(),
  },
  {
    id: 'n4',
    user_id: 'u-1',
    title: 'New comment from customer',
    message: 'On ticket #TKT-004: "The AC unit is still not cooling properly."',
    type: 'info',
    is_read: false,
    ticket_id: 't4',
    ticket_number: 'TKT-004',
    created_at: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
  {
    id: 'n5',
    user_id: 'u-1',
    title: 'Outbox event delivery failed',
    message: 'Failed to dispatch ticket.created event to n8n after 5 attempts. Ops alerted.',
    type: 'error',
    is_read: true,
    created_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
    read_at: new Date(Date.now() - 23 * 3600_000).toISOString(),
  },
  {
    id: 'n6',
    user_id: 'u-1',
    title: 'Ticket #TKT-005 reopened',
    message: 'Customer reports the original issue is not resolved.',
    type: 'warning',
    is_read: false,
    ticket_id: 't5',
    ticket_number: 'TKT-005',
    created_at: new Date(Date.now() - 4 * 3600_000).toISOString(),
  },
];

let mockStore: Notification[] = [...MOCK_NOTIFICATIONS];

function mockListNotifications(
  params?: { is_read?: boolean; limit?: number; offset?: number }
): Promise<NotificationsListResponse> {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;

  let items = [...mockStore];
  if (params?.is_read !== undefined) {
    items = items.filter((n) => n.is_read === params.is_read);
  }
  // Newest first
  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const total = items.length;
  const paged = items.slice(offset, offset + limit);
  const unread_count = mockStore.filter((n) => !n.is_read).length;

  return Promise.resolve({
    items: paged,
    total,
    unread_count,
    limit,
    offset,
  });
}
