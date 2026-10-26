// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TicketCreate from './TicketCreate';

const { create, upload, classify, toast } = vi.hoisted(() => ({
  create: vi.fn(),
  upload: vi.fn(),
  classify: vi.fn(),
  toast: { success: vi.fn(), warning: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('../lib/api', () => ({
  ticketApi: { create: (d: unknown) => create(d) },
  attachmentApi: { upload: (id: string, f: File) => upload(id, f) },
  aiApi: {
    classify: (t: string, d: string) => classify(t, d),
    searchKb: () => Promise.resolve([]),
    getKbArticle: () => Promise.resolve(null),
    recommend: () => Promise.resolve([]),
  },
}));
vi.mock('../lib/toast', () => ({ toastApi: toast }));
vi.mock('../hooks/useRole', () => ({ useRole: () => 'customer' }));

function setup() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/tickets/new']}>
        <Routes>
          <Route path="/tickets/new" element={<TicketCreate />} />
          <Route path="/tickets/:id" element={<div>detail-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fill = (title = 'Máy in bị kẹt giấy', desc = 'Máy in tầng 2 kẹt giấy từ sáng nay') => {
  fireEvent.change(screen.getByLabelText('Tiêu đề *'), { target: { value: title } });
  fireEvent.change(screen.getByLabelText('Mô tả *'), { target: { value: desc } });
};

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  create.mockReset();
  upload.mockReset();
  classify.mockReset();
  Object.values(toast).forEach((f) => f.mockReset());
  sessionStorage.clear();
});

describe('TicketCreate', () => {
  it('shows an error summary with specific messages when several fields are invalid', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Tạo ticket' }));
    const alert = await screen.findByText(/cần sửa/);
    expect(alert).toBeInTheDocument();
    expect(screen.getAllByText('Hãy nhập tiêu đề').length).toBeGreaterThan(0);
    expect(create).not.toHaveBeenCalled();
  });

  it('a single invalid field gets inline error and focus (no summary)', async () => {
    setup();
    fill('abc');
    fireEvent.change(screen.getByLabelText('Danh mục *'), { target: { value: 'network' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo ticket' }));
    const input = screen.getByLabelText('Tiêu đề *');
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText('Tiêu đề cần ít nhất 5 ký tự')).toBeInTheDocument();
    expect(screen.queryByText(/mục cần sửa/)).not.toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(input));
  });

  it('submits, uploads files and navigates to the new ticket', async () => {
    create.mockResolvedValue({ id: 't1', ticket_number: 'TKT-1' });
    upload.mockResolvedValue({});
    setup();
    fill();
    fireEvent.change(screen.getByLabelText('Danh mục *'), { target: { value: 'hardware' } });
    fireEvent.click(screen.getByLabelText(/Cao/));
    const file = new File(['x'], 'anh.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Chọn file đính kèm'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo ticket' }));
    expect(await screen.findByText('detail-page')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ category: 'hardware', priority: 'high' }));
    expect(upload).toHaveBeenCalledWith('t1', file);
    expect(toast.success).toHaveBeenCalled();
  });

  it('still navigates when some uploads fail, with a warning', async () => {
    create.mockResolvedValue({ id: 't2', ticket_number: 'TKT-2' });
    upload.mockRejectedValue(new Error('boom'));
    setup();
    fill();
    fireEvent.change(screen.getByLabelText('Danh mục *'), { target: { value: 'network' } });
    fireEvent.change(screen.getByLabelText('Chọn file đính kèm'), {
      target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo ticket' }));
    expect(await screen.findByText('detail-page')).toBeInTheDocument();
    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('1 file chưa tải lên'));
  });

  it('AI suggestion needs valid title+description, auto-applies when confident', async () => {
    classify.mockResolvedValue({ category: 'network', priority: 'critical', confidence: 0.9, method: 'ai' });
    setup();
    const btn = screen.getByRole('button', { name: /Gợi ý bằng AI/ });
    expect(btn).toBeDisabled();
    fill('Mất kết nối WiFi', 'WiFi tầng 3 không kết nối được');
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    expect(await screen.findByText(/Đã tự điền/)).toBeInTheDocument();
    expect(screen.getByLabelText('Danh mục *')).toHaveValue('network');
  });

  it('low-confidence AI result is only a suggestion until applied', async () => {
    classify.mockResolvedValue({ category: 'software', priority: 'low', confidence: 0.4, method: 'rule_based' });
    setup();
    fill('Cài phần mềm', 'Cần cài phần mềm kế toán mới');
    fireEvent.click(screen.getByRole('button', { name: /Gợi ý bằng AI/ }));
    const apply = await screen.findByRole('button', { name: 'Áp dụng gợi ý' });
    expect(screen.getByLabelText('Danh mục *')).toHaveValue('');
    fireEvent.click(apply);
    await waitFor(() => expect(screen.getByLabelText('Danh mục *')).toHaveValue('software'));
  });

  it('AI failure shows a light message and keeps the form usable', async () => {
    classify.mockRejectedValue(new Error('offline'));
    setup();
    fill('Cài phần mềm', 'Cần cài phần mềm kế toán mới');
    fireEvent.click(screen.getByRole('button', { name: /Gợi ý bằng AI/ }));
    await waitFor(() => expect(toast.info).toHaveBeenCalled());
    expect(screen.getByLabelText('Tiêu đề *')).toBeEnabled();
  });

  it('restores the draft from sessionStorage', () => {
    sessionStorage.setItem('dxfsm-ticket-draft', JSON.stringify({ title: 'Nháp cũ', description: 'mô tả nháp' }));
    setup();
    expect(screen.getByLabelText('Tiêu đề *')).toHaveValue('Nháp cũ');
  });
});
