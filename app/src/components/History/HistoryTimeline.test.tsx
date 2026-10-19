// SPDX-License-Identifier: Apache-2.0
// DX-FSM HistoryTimeline component tests (F5.4)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { HistoryTimeline } from './HistoryTimeline';
import * as historyLib from '../../lib/history';
import type { HistoryEvent } from '../../lib/history';

const baseActor = { id: 'u1', username: 'alice', full_name: 'Alice Nguyen' };

const mockEvents: HistoryEvent[] = [
  {
    id: 'e1',
    action: 'created',
    actor: baseActor,
    old_value: null,
    new_value: null,
    metadata: null,
    created_at: new Date(Date.now() - 60 * 60_000).toISOString(),
  },
  {
    id: 'e2',
    action: 'status_changed',
    actor: baseActor,
    old_value: 'new',
    new_value: 'in_progress',
    metadata: null,
    created_at: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
  {
    id: 'e3',
    action: 'sla_breached',
    actor: null,
    old_value: null,
    new_value: null,
    metadata: { overdue_minutes: 15 },
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
];

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HistoryTimeline ticketId="t1" />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('HistoryTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders section title', async () => {
    vi.spyOn(historyLib.historyApi, 'list').mockResolvedValue(mockEvents);
    setup();
    await waitFor(() => {
      expect(screen.getByText('Lịch sử')).toBeInTheDocument();
    });
  });

  it('shows event count', async () => {
    vi.spyOn(historyLib.historyApi, 'list').mockResolvedValue(mockEvents);
    setup();
    await waitFor(() => {
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });
  });

  it('renders all events', async () => {
    vi.spyOn(historyLib.historyApi, 'list').mockResolvedValue(mockEvents);
    setup();
    await waitFor(() => {
      expect(screen.getByText(/Alice Nguyen tạo ticket/)).toBeInTheDocument();
      expect(screen.getByText(/đổi trạng thái.*new.*in_progress/)).toBeInTheDocument();
      expect(screen.getByText(/SLA breach/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no events', async () => {
    vi.spyOn(historyLib.historyApi, 'list').mockResolvedValue([]);
    setup();
    await waitFor(() => {
      expect(screen.getByText(/Chưa có sự kiện/)).toBeInTheDocument();
    });
  });

  it('shows error state with retry', async () => {
    vi.spyOn(historyLib.historyApi, 'list').mockRejectedValue(new Error('Network error'));
    setup();
    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument();
  });

  it('orders events newest first', async () => {
    vi.spyOn(historyLib.historyApi, 'list').mockResolvedValue(mockEvents);
    setup();
    await waitFor(() => {
      // Get all <li> items in order
      const items = document.querySelectorAll('li');
      expect(items.length).toBe(3);
    });
    // First event in DOM should be sla_breached (newest, 5m ago)
    const firstItem = document.querySelector('li');
    expect(firstItem?.textContent).toMatch(/SLA breach/);
    // Last should be created (oldest, 1h ago)
    const items = document.querySelectorAll('li');
    const lastItem = items[items.length - 1];
    expect(lastItem.textContent).toMatch(/tạo ticket/);
  });

  it('renders action badge for each event', async () => {
    vi.spyOn(historyLib.historyApi, 'list').mockResolvedValue(mockEvents);
    setup();
    await waitFor(() => {
      expect(screen.getByText('created')).toBeInTheDocument();
      expect(screen.getByText('status_changed')).toBeInTheDocument();
      expect(screen.getByText('sla_breached')).toBeInTheDocument();
    });
  });
});
