// SPDX-License-Identifier: Apache-2.0
// DX-FSM NotificationItem component tests (F5.2)

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '../../lib/notifications';

const unreadNotif: Notification = {
  id: 'n1',
  user_id: 'u1',
  title: 'Test notification',
  message: 'Test message body',
  type: 'info',
  is_read: false,
  ticket_id: 't1',
  ticket_number: 'TKT-001',
  created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
};

const readNotif: Notification = {
  ...unreadNotif,
  id: 'n2',
  is_read: true,
  read_at: new Date().toISOString(),
};

function renderWithRouter(notif: Notification, onMarkRead = vi.fn()) {
  return render(
    <MemoryRouter>
      <NotificationItem notification={notif} onMarkRead={onMarkRead} />
    </MemoryRouter>
  );
}

describe('NotificationItem', () => {
  it('renders title and message', () => {
    renderWithRouter(unreadNotif);
    expect(screen.getByText('Test notification')).toBeInTheDocument();
    expect(screen.getByText('Test message body')).toBeInTheDocument();
  });

  it('renders ticket reference when present', () => {
    renderWithRouter(unreadNotif);
    expect(screen.getByText('TKT-001')).toBeInTheDocument();
  });

  it('does not render ticket ref when missing', () => {
    const noTicket = { ...unreadNotif, ticket_id: null, ticket_number: null };
    renderWithRouter(noTicket);
    expect(screen.queryByText('TKT-001')).not.toBeInTheDocument();
  });

  it('calls onMarkRead when unread item clicked', () => {
    const onMarkRead = vi.fn();
    renderWithRouter(unreadNotif, onMarkRead);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onMarkRead).toHaveBeenCalledWith('n1');
  });

  it('does NOT call onMarkRead when read item clicked', () => {
    const onMarkRead = vi.fn();
    renderWithRouter(readNotif, onMarkRead);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it('aria-label indicates unread state', () => {
    renderWithRouter(unreadNotif);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toMatch(/Chưa đọc:/);
  });

  it('aria-label omits unread prefix when read', () => {
    renderWithRouter(readNotif);
    const button = screen.getByRole('button');
    const label = button.getAttribute('aria-label') || '';
    expect(label).not.toMatch(/^Chưa đọc:/);
  });

  it('shows an "Mới" label for unread items only (not color alone)', () => {
    const { unmount } = renderWithRouter(unreadNotif);
    expect(screen.getByText('Mới')).toBeInTheDocument();
    unmount();
    renderWithRouter(readNotif);
    expect(screen.queryByText('Mới')).not.toBeInTheDocument();
  });

  it('exposes the type of notification as an icon title', () => {
    const { container, rerender } = renderWithRouter({ ...unreadNotif, type: 'success' });
    expect(container.querySelector('[title="Thành công"]')).toBeInTheDocument();
    for (const [type, title] of [['warning', 'Cảnh báo'], ['error', 'Lỗi']] as const) {
      rerender(
        <MemoryRouter>
          <NotificationItem notification={{ ...unreadNotif, type }} onMarkRead={vi.fn()} />
        </MemoryRouter>
      );
      expect(container.querySelector(`[title="${title}"]`)).toBeInTheDocument();
    }
  });

  it('navigates to the ticket and calls onNavigate', () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <NotificationItem notification={unreadNotif} onMarkRead={vi.fn()} onNavigate={onNavigate} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onNavigate).toHaveBeenCalled();
  });
});
