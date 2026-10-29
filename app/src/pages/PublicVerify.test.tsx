// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PublicVerify from './PublicVerify';
import * as api from '../lib/api';

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api');
  return {
    ...actual,
    verifyWorkOrder: vi.fn(),
  };
});

describe('PublicVerify Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search bar and header properly', () => {
    render(
      <MemoryRouter initialEntries={['/verify']}>
        <Routes>
          <Route path="/verify" element={<PublicVerify />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Tra cứu & Kiểm chứng Biên bản Nghiệm thu Số')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mã phiếu sự cố/i)).toBeInTheDocument();
  });

  it('automatically verifies when ticketRef param is in URL', async () => {
    vi.mocked(api.verifyWorkOrder).mockResolvedValueOnce({
      valid: true,
      status_label: 'Biên bản hợp lệ & Đã niêm phong mật mã',
      ticket_number: 'TKT-2026-000003',
      title: 'Máy chiếu Lab 301 không nhận tín hiệu',
      category: 'hardware',
      priority: 'medium',
      status: 'resolved',
      location: 'Khuôn viên HaUI Campus',
      technician_name: 'Hoàng M. T.',
      resolved_at: '2026-10-27T14:56:08Z',
      sla_met: true,
      seal_code: 'A7B7-3124-D1BC-D0D6',
      full_hash: 'A7B73124D1BCD0D68F4838580A6E9E2AF91369D09EF3A78F654CF73600BCE0D6',
      issued_by: 'HaUI ICT Center',
      algorithm: 'HMAC-SHA256 (RFC 2104)',
    });

    render(
      <MemoryRouter initialEntries={['/verify/TKT-2026-000003']}>
        <Routes>
          <Route path="/verify/:ticketRef" element={<PublicVerify />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CHỨNG NHẬN NIÊM PHONG SỐ HỢP LỆ')).toBeInTheDocument();
    });

    expect(screen.getAllByText('TKT-2026-000003').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Hoàng M. T.')).toBeInTheDocument();
    expect(screen.getByText('A7B7-3124-D1BC-D0D6')).toBeInTheDocument();
    expect(screen.getByText(/Đạt chuẩn SLA/i)).toBeInTheDocument();
  });

  it('displays warning when cryptographic seal does not match (tampered)', async () => {
    vi.mocked(api.verifyWorkOrder).mockResolvedValueOnce({
      valid: false,
      status_label: 'Chữ ký mật mã không khớp (nghi vấn bị sửa lén)',
      reason: 'Biên bản có dấu hiệu bị can thiệp trái phép.',
      ticket_number: 'TKT-2026-000003',
    });

    render(
      <MemoryRouter initialEntries={['/verify/TKT-2026-000003']}>
        <Routes>
          <Route path="/verify/:ticketRef" element={<PublicVerify />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('XÁC THỰC THẤT BẠI')).toBeInTheDocument();
    });

    expect(screen.getByText('Chữ ký mật mã không khớp (nghi vấn bị sửa lén)')).toBeInTheDocument();
  });
});
