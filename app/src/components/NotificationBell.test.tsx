// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

const h = vi.hoisted(() => ({
  list: vi.fn(),
  markRead: vi.fn(),
  markAll: vi.fn(),
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('../lib/notifications', async (orig) => ({
  ...(await orig<typeof import('../lib/notifications')>()),
  notificationsApi: { list: (p: unknown) => h.list(p), markRead: (id: string) => h.markRead(id), markAllRead: () => h.markAll() },
}));
vi.mock('../lib/toast', () => ({ toastApi: h.toast }));

const n = (id: string, is_read = false) => ({
  id, user_id: 'u', title: `Tiêu đề ${id}`, message: 'nội dung', type: 'info' as const, is_read,
  ticket_id: 't1', ticket_number: 'TKT-1', created_at: new Date().toISOString(),
});
const resp = (items: ReturnType<typeof n>[], unread_count: number) => ({ items, total: items.length, unread_count, limit: 10, offset: 0 });

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...utils, qc };
}

beforeEach(() => {
  h.list.mockReset();
  h.markRead.mockReset().mockResolvedValue({});
  h.markAll.mockReset().mockResolvedValue({ marked: 2 });
  Object.values(h.toast).forEach((f) => f.mockReset());
});

describe('NotificationBell', () => {
  it('aria-label carries the unread count', async () => {
    h.list.mockResolvedValue(resp([n('a'), n('b')], 2));
    setup();
    expect(await screen.findByRole('button', { name: 'Thông báo, 2 chưa đọc' })).toBeInTheDocument();
  });

  it('caps the visible badge at 99+', async () => {
    h.list.mockResolvedValue(resp([n('a')], 150));
    setup();
    expect(await screen.findByText('99+')).toBeInTheDocument();
  });

  it('opens a dropdown with items; Esc closes it and returns focus', async () => {
    h.list.mockResolvedValue(resp([n('a')], 1));
    setup();
    const bell = await screen.findByRole('button', { name: /Thông báo, 1/ });
    fireEvent.click(bell);
    expect(await screen.findByRole('dialog', { name: 'Thông báo' })).toBeInTheDocument();
    expect(screen.getByText('Tiêu đề a')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem tất cả' })).toHaveAttribute('href', '/notifications');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(bell);
  });

  it('mark all as read calls the API and drops the badge immediately', async () => {
    h.list.mockResolvedValue(resp([n('a'), n('b')], 2));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: /Thông báo, 2/ }));
    h.list.mockResolvedValue(resp([n('a', true), n('b', true)], 0));
    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }));
    await waitFor(() => expect(h.markAll).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Thông báo, 0 chưa đọc' })).toBeInTheDocument();
  });

  it('shows the empty message', async () => {
    h.list.mockResolvedValue(resp([], 0));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: /Thông báo, 0/ }));
    expect(await screen.findByText('Bạn đã xem hết thông báo.')).toBeInTheDocument();
  });

  it('toasts once (merged) for new notifications on a later poll, not on first load', async () => {
    h.list.mockResolvedValue(resp([n('a')], 1));
    const { qc } = setup();
    await screen.findByRole('button', { name: /Thông báo, 1/ });
    expect(h.toast.info).not.toHaveBeenCalled();

    h.list.mockResolvedValue(resp([n('x'), n('y'), n('a')], 3));
    await act(async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    });
    await waitFor(() => expect(h.toast.info).toHaveBeenCalledTimes(1));
    expect(h.toast.info).toHaveBeenCalledWith('Có 2 thông báo mới');

    // poll lại cùng dữ liệu: không toast trùng
    await act(async () => {
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    });
    expect(h.toast.info).toHaveBeenCalledTimes(1);
  });
});
