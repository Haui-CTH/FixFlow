// SPDX-License-Identifier: Apache-2.0
// DX-FSM Notifications page tests (F5.2)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Notifications from './Notifications';

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Notifications page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Thông báo')).toBeInTheDocument();
    });
  });

  it('shows filter tabs', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Tất cả/ })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Chưa đọc/ })).toBeInTheDocument();
    });
  });

  it('displays unread count badge', async () => {
    setup();
    await waitFor(() => {
      const badge = screen.getByLabelText(/\d+ chưa đọc/);
      expect(badge).toBeInTheDocument();
    });
  });

  it('renders notification items from mock data', async () => {
    setup();
    await waitFor(() => {
      // Mock has 6 items
      const buttons = screen.getAllByRole('button');
      // Filter only items (not tab/header buttons)
      const itemButtons = buttons.filter((b) => b.getAttribute('aria-label')?.includes('Chưa đọc:'));
      expect(itemButtons.length).toBeGreaterThan(0);
    });
  });

  it('renders Mark all as read button', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Đánh dấu tất cả đã đọc')).toBeInTheDocument();
    });
  });

  it('switches to Unread filter', async () => {
    setup();
    await waitFor(() => screen.getByText('Thông báo'));

    const unreadTab = screen.getByRole('tab', { name: /Chưa đọc/ });
    fireEvent.click(unreadTab);

    // After switching, tab should be active
    await waitFor(() => {
      expect(unreadTab.getAttribute('aria-selected')).toBe('true');
    });
  });
});
