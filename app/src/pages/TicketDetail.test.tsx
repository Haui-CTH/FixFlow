// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TicketDetail from './TicketDetail';

const h = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  me: vi.fn(),
  techs: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  role: { current: 'manager' as string | null },
}));

vi.mock('../lib/api', () => ({
  ticketApi: { get: (id: string) => h.get(id), update: (id: string, p: unknown) => h.update(id, p) },
  commentApi: { list: () => Promise.resolve([{ id: 'c1' }, { id: 'c2' }]), post: vi.fn(), remove: vi.fn() },
  attachmentApi: { list: () => Promise.resolve([]), upload: vi.fn(), remove: vi.fn(), blob: vi.fn() },
  userApi: { me: () => h.me(), technicians: () => h.techs() },
}));
vi.mock('../lib/toast', () => ({ toastApi: h.toast }));
vi.mock('../hooks/useRole', () => ({ useRole: () => h.role.current }));
vi.mock('../components/Notes/NotesPanel', () => ({ NotesPanel: () => <div>notes-panel</div> }));
vi.mock('../components/History/HistoryTimeline', () => ({ HistoryTimeline: () => <div>history-panel</div> }));

const ticket = (over: Record<string, unknown> = {}) => ({
  id: 't1',
  ticket_number: 'TKT-1',
  title: 'Máy in hỏng',
  description: 'Mô tả dài',
  status: 'new',
  priority: 'high',
  category: 'hardware',
  customer_id: 'u-cust',
  customer_name: 'Khách A',
  technician_id: null,
  technician_name: null,
  created_at: '2026-01-01T00:00:00Z',
  sla_deadline: null,
  ...over,
});

function setup(url = '/tickets/t1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  Object.values(h.toast).forEach((f) => f.mockReset());
  h.get.mockReset();
  h.update.mockReset();
  h.role.current = 'manager';
  h.me.mockResolvedValue({ user_id: 'u-me', technician_id: 'tech-me', username: 'me', role: 'manager' });
  h.techs.mockResolvedValue([]);
});

describe('TicketDetail', () => {
  it('renders header and switches tabs, syncing ?tab=', async () => {
    h.get.mockResolvedValue({ data: ticket() });
    setup();
    expect(await screen.findByRole('heading', { level: 1, name: 'Máy in hỏng' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tổng quan/ })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: /Lịch sử/ }));
    expect(await screen.findByText('history-panel')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('opens the tab given in the URL and shows comment count', async () => {
    h.get.mockResolvedValue({ data: ticket() });
    setup('/tickets/t1?tab=notes');
    expect(await screen.findByText('notes-panel')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('tab', { name: /Bình luận/ })).toHaveTextContent('2'));
  });

  it('hides the internal notes tab for customers', async () => {
    h.role.current = 'customer';
    h.get.mockResolvedValue({ data: ticket() });
    setup('/tickets/t1?tab=notes');
    await screen.findByRole('heading', { level: 1, name: 'Máy in hỏng' });
    expect(screen.queryByRole('tab', { name: /Ghi chú nội bộ/ })).not.toBeInTheDocument();
    expect(screen.queryByText('notes-panel')).not.toBeInTheDocument();
  });

  it('manager sees assign on a new ticket; technician sees only start on own assigned ticket', async () => {
    h.get.mockResolvedValue({ data: ticket() });
    const { unmount } = setup();
    expect(await screen.findByRole('button', { name: 'Phân công' })).toBeInTheDocument();
    unmount();

    h.role.current = 'technician';
    h.get.mockResolvedValue({ data: ticket({ status: 'assigned', technician_id: 'tech-me' }) });
    setup();
    expect(await screen.findByRole('button', { name: 'Bắt đầu xử lý' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Huỷ ticket' })).not.toBeInTheDocument();
  });

  it('changes status and shows a success toast', async () => {
    h.role.current = 'technician';
    h.get.mockResolvedValue({ data: ticket({ status: 'assigned', technician_id: 'tech-me' }) });
    h.update.mockResolvedValue(ticket({ status: 'in_progress', technician_id: 'tech-me' }));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Bắt đầu xử lý' }));
    await waitFor(() => expect(h.update).toHaveBeenCalledWith('t1', { status: 'in_progress' }));
    await waitFor(() => expect(h.toast.success).toHaveBeenCalled());
  });

  it('rolls back and shows an error toast when the change fails', async () => {
    h.role.current = 'technician';
    h.get.mockResolvedValue({ data: ticket({ status: 'assigned', technician_id: 'tech-me' }) });
    h.update.mockRejectedValue(new Error('403'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Bắt đầu xử lý' }));
    await waitFor(() => expect(h.toast.error).toHaveBeenCalled());
    // quay về trạng thái cũ -> vẫn còn nút "Bắt đầu xử lý"
    expect(await screen.findByRole('button', { name: 'Bắt đầu xử lý' })).toBeEnabled();
  });

  it('cancel asks for confirmation before calling the API', async () => {
    h.get.mockResolvedValue({ data: ticket() });
    h.update.mockResolvedValue(ticket({ status: 'cancelled' }));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Huỷ ticket' }));
    expect(h.update).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    await waitFor(() => expect(h.update).toHaveBeenCalledWith('t1', { status: 'cancelled' }));
    expect(dialog).toBeDefined();
  });

  it('shows a not-found state for a 404', async () => {
    h.get.mockRejectedValue({ response: { status: 404 } });
    setup();
    expect(await screen.findByText('Không tìm thấy ticket')).toBeInTheDocument();
  });
});
