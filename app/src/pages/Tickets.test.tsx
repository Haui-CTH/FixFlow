// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Tickets from './Tickets';

const list = vi.fn();
vi.mock('../lib/api', () => ({ ticketApi: { list: (p: unknown) => list(p) } }));
vi.mock('../hooks/useRole', () => ({ useRole: () => 'manager' }));

const mk = (n: number) => ({
  id: `id${n}`,
  ticket_number: `TKT-${n}`,
  title: `Lỗi số ${n}`,
  status: 'new',
  priority: 'critical',
  category: 'network',
  technician_name: null,
  created_at: '2026-01-01T00:00:00Z',
  sla_deadline: null,
});
const resp = (items: ReturnType<typeof mk>[], total = items.length) => ({
  items,
  total,
  page_limit: 20,
  page_offset: 0,
});

function setup(url = '/tickets', mine = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <Tickets mine={mine} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => list.mockReset());

describe('Tickets page', () => {
  it('renders tickets with total and the critical priority label', async () => {
    list.mockResolvedValue(resp([mk(1), mk(2)], 2));
    setup();
    expect((await screen.findAllByText('TKT-1')).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1, name: 'Tất cả ticket (2)' })).toBeInTheDocument();
    expect(screen.getAllByText('Khẩn cấp').length).toBeGreaterThan(0);
  });

  it('my-tickets mode sends mine=true and uses its own title', async () => {
    list.mockResolvedValue(resp([mk(1)]));
    setup('/my-tickets', true);
    await screen.findAllByText('TKT-1');
    expect(list.mock.calls[0][0]).toMatchObject({ mine: true });
    expect(screen.getByRole('heading', { level: 1, name: 'Ticket của tôi (1)' })).toBeInTheDocument();
  });

  it('reads filters from the URL and sends them to the API', async () => {
    list.mockResolvedValue(resp([mk(1)]));
    setup('/tickets?status=new&priority=high&sort=sla_deadline:asc&page=2&size=10');
    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(list.mock.calls[0][0]).toMatchObject({
      status: 'new',
      priority: 'high',
      sort_by: 'sla_deadline',
      sort_dir: 'asc',
      limit: 10,
      offset: 10,
    });
  });

  it('changing a filter refetches and shows a removable chip', async () => {
    list.mockResolvedValue(resp([mk(1)]));
    setup();
    await screen.findAllByText('TKT-1');
    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'closed' } });
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'closed' })));
    fireEvent.click(await screen.findByRole('button', { name: /Bỏ lọc Trạng thái/ }));
    // khoá cache của bộ lọc rỗng còn tươi nên không gọi lại API; kiểm tra UI đã bỏ lọc
    await waitFor(() => expect(screen.getByLabelText('Trạng thái')).toHaveValue(''));
    expect(screen.queryByRole('button', { name: /Bỏ lọc/ })).not.toBeInTheDocument();
  });

  it('search is debounced into the query', async () => {
    list.mockResolvedValue(resp([mk(1)]));
    setup();
    await screen.findAllByText('TKT-1');
    fireEvent.change(screen.getByLabelText('Tìm ticket theo tiêu đề'), { target: { value: 'wifi' } });
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'wifi' })), {
      timeout: 1500,
    });
  });

  it('clicking a sortable header toggles direction (aria-sort)', async () => {
    list.mockResolvedValue(resp([mk(1)]));
    setup();
    await screen.findAllByText('TKT-1');
    expect(screen.getByRole('columnheader', { name: /Ngày tạo/ })).toHaveAttribute('aria-sort', 'descending');
    fireEvent.click(screen.getByRole('button', { name: /Ngày tạo/ }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ sort_by: 'created_at', sort_dir: 'asc' })),
    );
  });

  it('paginates', async () => {
    list.mockResolvedValue(resp([mk(1)], 45));
    setup();
    await screen.findAllByText('TKT-1');
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 20 })));
  });

  it('empty state without filters offers create', async () => {
    list.mockResolvedValue(resp([]));
    setup();
    expect(await screen.findByText('Chưa có ticket nào')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Tạo ticket/ }).length).toBeGreaterThan(0);
  });

  it('empty state with filters offers clearing them', async () => {
    list.mockResolvedValue(resp([]));
    setup('/tickets?status=closed');
    expect(await screen.findByText('Không có ticket khớp bộ lọc')).toBeInTheDocument();
    list.mockResolvedValue(resp([mk(1)]));
    fireEvent.click(screen.getAllByRole('button', { name: 'Xoá lọc' })[0]);
    expect((await screen.findAllByText('TKT-1')).length).toBeGreaterThan(0);
  });

  it('renders Export Excel (CSV) button when tickets are loaded', async () => {
    list.mockResolvedValue(resp([mk(1)]));
    setup();
    expect(await screen.findByRole('button', { name: /Xuất Excel \(CSV\)/ })).toBeInTheDocument();
  });

  it('error state with retry', async () => {
    list.mockRejectedValue(new Error('boom'));
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được danh sách ticket');
    list.mockResolvedValue(resp([mk(1)]));
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect((await screen.findAllByText('TKT-1')).length).toBeGreaterThan(0);
  });
});
