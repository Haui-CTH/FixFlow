// SPDX-License-Identifier: Apache-2.0
// DX-FSM Ticket CSV / Excel Exporter (Chuẩn UTF-8 BOM chống vỡ font tiếng Việt)

import type { Ticket } from './api';
import { categoryMeta, statusMeta, priorityMeta } from './ticket-meta';
import { formatDate } from './format';

/**
 * Tạo nội dung CSV chuẩn UTF-8 kèm tiền tố Byte Order Mark (\uFEFF)
 * để Microsoft Excel trên Windows tự động nhận diện tiếng Việt có dấu.
 */
export function generateTicketsCSV(tickets: Ticket[]): string {
  const headers = [
    'Mã phiếu',
    'Tiêu đề',
    'Danh mục',
    'Mức ưu tiên',
    'Trạng thái',
    'Người yêu cầu',
    'Email yêu cầu',
    'Kỹ thuật viên',
    'Vị trí hiện trường',
    'Thời điểm tạo',
    'Cam kết SLA',
  ];

  const escapeField = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = tickets.map((t) => {
    let slaText = 'Đang theo dõi';
    if (t.sla_met === true) slaText = 'Đạt chuẩn (Đúng hạn)';
    else if (t.sla_met === false) slaText = 'Quá hạn cam kết';
    else if (t.status === 'resolved' || t.status === 'closed') slaText = 'Hoàn tất';

    return [
      escapeField(t.ticket_number || t.id),
      escapeField(t.title),
      escapeField(categoryMeta(t.category).label),
      escapeField(priorityMeta(t.priority).label),
      escapeField(statusMeta(t.status).label),
      escapeField(t.customer_name || 'Khách hàng'),
      escapeField(t.customer_email || ''),
      escapeField(t.technician_name || 'Chưa phân công'),
      escapeField(t.customer_location || 'Khuôn viên HaUI'),
      escapeField(formatDate(t.created_at, true)),
      escapeField(slaText),
    ].join(',');
  });

  // \uFEFF là UTF-8 BOM bắt buộc để Excel hiển thị đúng dấu tiếng Việt
  return '\uFEFF' + [headers.map(escapeField).join(','), ...rows].join('\r\n');
}

/**
 * Kích hoạt tải xuống tệp CSV trực tiếp trên trình duyệt
 */
export function downloadTicketsCSV(tickets: Ticket[], filenamePrefix = 'FixFlow_Bao_cao_Su_co'): void {
  const csvContent = generateTicketsCSV(tickets);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

