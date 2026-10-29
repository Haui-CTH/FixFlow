// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from 'vitest';
import type { Ticket } from './api';
import { generateTicketsCSV, downloadTicketsCSV } from './export-csv';

describe('export-csv utility', () => {
  const mockTickets: Ticket[] = [
    {
      id: 'uuid-1',
      ticket_number: 'TKT-2026-000001',
      title: 'Máy in phòng Lab 402 bị kẹt giấy "A4"',
      category: 'hardware',
      priority: 'high',
      status: 'resolved',
      customer_name: 'Nguyễn Văn A',
      customer_email: 'a@haui.edu.vn',
      technician_name: 'Hoàng M. T.',
      customer_location: 'Tòa nhà A10, Phòng 402',
      created_at: '2026-10-28T08:00:00Z',
      updated_at: '2026-10-28T10:00:00Z',
      sla_met: true,
    },
    {
      id: 'uuid-2',
      ticket_number: 'TKT-2026-000002',
      title: 'Mạng Wi-Fi chập chờn',
      category: 'network',
      priority: 'urgent',
      status: 'open',
      customer_name: 'Trần Thị B',
      customer_location: 'Xưởng C',
      created_at: '2026-10-28T09:00:00Z',
      updated_at: '2026-10-28T09:00:00Z',
      sla_met: false,
    },
  ];

  it('generates valid CSV with UTF-8 BOM prefix', () => {
    const csv = generateTicketsCSV(mockTickets);
    // Starts with UTF-8 BOM
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    // Header exists
    expect(csv).toContain('Mã phiếu');
    expect(csv).toContain('Tiêu đề');
    expect(csv).toContain('Cam kết SLA');

    // First ticket escaped properly with quotes
    expect(csv).toContain('TKT-2026-000001');
    expect(csv).toContain('Máy in phòng Lab 402 bị kẹt giấy ""A4""');
    expect(csv).toContain('Đạt chuẩn (Đúng hạn)');
    expect(csv).toContain('Tòa nhà A10, Phòng 402');

    // Second ticket overdue status
    expect(csv).toContain('TKT-2026-000002');
    expect(csv).toContain('Quá hạn cam kết');
  });

  it('handles empty tickets list gracefully', () => {
    const csv = generateTicketsCSV([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('Mã phiếu');
  });

  it('triggers browser download via blob and link click', () => {
    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    // Mock HTMLAnchorElement click
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    // Provide mock for URL.createObjectURL and revokeObjectURL in jsdom
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrlMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectUrlMock = vi.fn();
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;

    try {
      downloadTicketsCSV(mockTickets, 'Test_Report');

      expect(createObjectUrlMock).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:mock-url');
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
      URL.revokeObjectURL = originalRevokeObjectUrl;
    }
  });
});

