// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Notifications, { groupByDay } from './Notifications';

const list = vi.fn();
vi.mock('../lib/notifications', async (orig) => ({
  ...(await orig<typeof import('../lib/notifications')>()),
  notificationsApi: { list: (p: unknown) => list(p), markRead: vi.fn(), markAllRead: vi.fn().mockResolvedValue({ marked: 0 }) },
}));

const mk = (id: string, daysAgo: number, is_read = false) => ({
  id, user_id: 'u', title: `T-${id}`, message: 'm', type: 'info' as const, is_read,
  created_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
});
const resp = (items: ReturnType<typeof mk>[], total = items.length, unread_count = 1) => ({ items, total, unread_count, limit: 20, offset: 0 });

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => list.mockReset());

describe('groupByDay', () => {
  it('groups into today / yesterday / older', () => {
    const now = new Date('2026-01-10T12:00:00');
    const items = [
      { ...mk('a', 0), created_at: '2026-01-10T08:00:00' },
      { ...mk('b', 1), created_at: '2026-01-09T23:00:00' },
      { ...mk('c', 5), created_at: '2026-01-05T10:00:00' },
    ];
    expect(groupByDay(items, now).map((g) => [g.label, g.items.length])).toEqual([
      ['Hôm nay', 1],
      ['Hôm qua', 1],
      ['Cũ hơn', 1],
    ]);
  });
});

describe('Notifications page states', () => {
  it('renders grouped items', async () => {
    list.mockResolvedValue(resp([mk('a', 0), mk('b', 3)]));
    setup();
    expect(await screen.findByText('T-a')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hôm nay' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cũ hơn' })).toBeInTheDocument();
  });

  it('unread filter sends is_read=false; empty state says you are caught up', async () => {
    list.mockResolvedValue(resp([mk('a', 0)]));
    setup();
    await screen.findByText('T-a');
    list.mockResolvedValue(resp([], 0, 0));
    fireEvent.click(screen.getByRole('tab', { name: /Chưa đọc/ }));
    expect(await screen.findByText('Bạn đã xem hết thông báo')).toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ is_read: false }));
  });

  it('load more grows the limit', async () => {
    list.mockResolvedValue(resp([mk('a', 0)], 45));
    setup();
    await screen.findByText('T-a');
    fireEvent.click(screen.getByRole('button', { name: 'Tải thêm' }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 40 })));
  });

  it('error state with retry', async () => {
    list.mockRejectedValueOnce(new Error('x'));
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được thông báo');
    list.mockResolvedValue(resp([mk('a', 0)]));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('T-a')).toBeInTheDocument();
  });
});
