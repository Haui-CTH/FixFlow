// SPDX-License-Identifier: Apache-2.0
// WorkOrderModal: Biên bản Bàn giao & Nghiệm thu Dịch vụ Kỹ thuật Hiện trường (HaUI Campus)

import { Printer } from 'lucide-react';
import type { Ticket } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { categoryMeta, statusMeta, priorityMeta } from '../../lib/ticket-meta';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function WorkOrderModal({
  ticket,
  open,
  onClose,
}: {
  ticket: Ticket;
  open: boolean;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  const workOrderCode = `WO-${ticket.ticket_number || ticket.id.substring(0, 8).toUpperCase()}`;

  return (
    <Modal open={open} title="Biên bản Nghiệm thu Dịch vụ Kỹ thuật" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: 'var(--text, #1e293b)' }}>
        {/* Header Quốc hiệu / Đơn vị */}
        <div style={{ borderBottom: '2px solid var(--border, #cbd5e1)', paddingBottom: '12px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            BỘ CÔNG THƯƠNG — ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
            TRUNG TÂM CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG (HaUI ICT)
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '12px 0 4px', textTransform: 'uppercase', color: '#0284c7' }}>
            BIÊN BẢN NGHIỆM THU DỊCH VỤ KỸ THUẬT HIỆN TRƯỜNG
          </h2>
          <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted, #64748b)' }}>
            Mã biên bản: <strong>{workOrderCode}</strong> — Ngày in: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>

        {/* Thông tin sự cố */}
        <div style={{ background: 'var(--bg-subtle, #f8fafc)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border, #e2e8f0)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0f172a' }}>1. THÔNG TIN SỰ CỐ & THIẾT BỊ</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div><strong>Tiêu đề:</strong> {ticket.title}</div>
            <div><strong>Mã phiếu:</strong> {ticket.ticket_number || ticket.id}</div>
            <div><strong>Danh mục:</strong> {categoryMeta(ticket.category).label}</div>
            <div><strong>Mức ưu tiên:</strong> {priorityMeta(ticket.priority).label}</div>
            <div><strong>Vị trí hiện trường:</strong> {ticket.customer_location || 'Khuôn viên HaUI Campus'}</div>
            <div><strong>Trạng thái:</strong> {statusMeta(ticket.status).label}</div>
          </div>
          {ticket.description && (
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
              <strong>Mô tả chi tiết:</strong> {ticket.description}
            </div>
          )}
        </div>

        {/* Thông tin thực hiện & SLA */}
        <div style={{ background: 'var(--bg-subtle, #f8fafc)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border, #e2e8f0)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#0f172a' }}>2. KẾT QUẢ XỬ LÝ & ĐÁNH GIÁ SLA</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div><strong>Người yêu cầu:</strong> {ticket.customer_name || 'Khách hàng'}</div>
            <div><strong>Email liên hệ:</strong> {ticket.customer_email || '-'}</div>
            <div><strong>Kỹ thuật viên xử lý:</strong> {ticket.technician_name || 'Chưa phân công'}</div>
            <div><strong>Thời điểm tạo:</strong> {formatDate(ticket.created_at, true)}</div>
            <div><strong>Thời điểm cập nhật:</strong> {formatDate(ticket.updated_at, true)}</div>
            <div><strong>Cam kết SLA:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Đạt tiêu chuẩn chất lượng</span></div>
          </div>
        </div>

        {/* Khung chữ ký nghiệm thu */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>ĐẠI DIỆN BÊN YÊU CẦU</div>
            <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b' }}>(Ký và ghi rõ họ tên)</div>
            <div style={{ height: '60px' }}></div>
            <div style={{ fontWeight: '500' }}>{ticket.customer_name || 'Khách hàng'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>KỸ THUẬT VIÊN THỰC HIỆN</div>
            <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b' }}>(Ký và xác nhận hoàn tất)</div>
            <div style={{ height: '60px' }}></div>
            <div style={{ fontWeight: '500' }}>{ticket.technician_name || 'Kỹ thuật viên'}</div>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '12px' }}>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer size={16} style={{ marginRight: '6px' }} /> In biên bản (A4)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
