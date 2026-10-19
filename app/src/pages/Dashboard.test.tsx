// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

const get = vi.fn();
vi.mock('../lib/api', () => ({ metricsApi: { get: (p: unknown) => get(p) } }));

const metrics = (over: Record<string, unknown> = {}) => ({
  data: {
    generated_at: '2026-01-02T10:00:00Z',
    window_days: 30,
    total_tickets: 50,
    by_status: [
      { status: 'new', count: 11 },
      { status: 'in_progress', count: 13 },
    ],
    by_priority: [{ priority: 'critical', count: 2 }],
    by_category: [{ category: 'network', count: 13 }],
    sla: { total_active: 24, on_time: 20, breached: 4, met: 10, not_met: 2, breach_rate: 0.15 },
    activity: { last_24h_created: 5, last_24h_resolved: 3, last_24h_breached: 1 },
    outbox: { pending: 2, sending: 0, sent: 40, failed: 1, oldest_pending_age_sec: 120 },
    top_assignees: [{ user_id: 'u1', username: 'a', full_name: 'An', active_tickets: 3, resolved_tickets: 4 }],
    ...over,
  },
});

function setup(url = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => get.mockReset());

describe('Dashboard', () => {
  it('renders KPIs and sections from the metrics response', async () => {
    get.mockResolvedValue(metrics());
    setup();
    expect(await screen.findByText('Tổng ticket')).toBeInTheDocument();
    expect(screen.getByText('Tỉ lệ vi phạm SLA')).toBeInTheDocument();
    expect(screen.getByText('15.0%', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText('Đang chờ: 2')).toBeInTheDocument();
    expect(screen.getByText('Mới')).toBeInTheDocument(); // nhãn tiếng Việt từ ticket-meta
    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument(); // critical -> Khẩn cấp
    expect(screen.getByText('Hoạt động 24 giờ qua')).toBeInTheDocument();
  });

  it('reads the window from the URL and refetches when it changes', async () => {
    get.mockResolvedValue(metrics());
    setup('/?days=90');
    await screen.findByText('Tổng ticket');
    expect(get).toHaveBeenCalledWith({ window_days: 90 });
    fireEvent.click(screen.getByLabelText('7 ngày'));
    await waitFor(() => expect(get).toHaveBeenLastCalledWith({ window_days: 7 }));
    expect(screen.getByRole('radiogroup', { name: 'Khoảng thời gian' })).toBeInTheDocument();
  });

  it('shows an error state with retry', async () => {
    get.mockRejectedValueOnce(new Error('boom'));
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được số liệu');
    get.mockResolvedValue(metrics());
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Tổng ticket')).toBeInTheDocument();
  });

  it('shows an empty state with a hint when there is no data', async () => {
    get.mockResolvedValue(metrics({ total_tickets: 0 }));
    setup('/?days=7');
    expect(await screen.findByText('Chưa có dữ liệu trong 7 ngày')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xem 365 ngày' }));
    await waitFor(() => expect(get).toHaveBeenLastCalledWith({ window_days: 365 }));
  });

  it('refresh button refetches', async () => {
    get.mockResolvedValue(metrics());
    setup();
    await screen.findByText('Tổng ticket');
    const calls = get.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới số liệu' }));
    await waitFor(() => expect(get.mock.calls.length).toBeGreaterThan(calls));
  });
});
