// SPDX-License-Identifier: Apache-2.0
// WorkOrderModal: Biên bản Bàn giao & Nghiệm thu Dịch vụ Kỹ thuật Hiện trường (HaUI Campus)
// Tích hợp Con dấu Niêm phong Số HMAC-SHA256 & Mã QR Kiểm chứng Công khai

import { ExternalLink, Printer, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${ticket.ticket_number || ticket.id}${ticket.seal_code ? `?code=${ticket.seal_code}` : ''}`;

  let slaLabel = 'Đang theo dõi cam kết';
  let slaColor = 'var(--text-muted, #64748b)';
  if (ticket.sla_met === true) {
    slaLabel = 'Đạt tiêu chuẩn SLA (Đúng hạn)';
    slaColor = 'var(--success, #16a34a)';
  } else if (ticket.sla_met === false) {
    slaLabel = 'Quá hạn cam kết (Trễ hạn)';
    slaColor = 'var(--danger, #dc2626)';
  } else if (ticket.status === 'resolved' || ticket.status === 'closed') {
    slaLabel = 'Hoàn tất nghiệm thu';
    slaColor = 'var(--success, #16a34a)';
  }

  return (
    <Modal open={open} title="Biên bản Nghiệm thu Dịch vụ Kỹ thuật" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: 'var(--text, #1e293b)' }}>
        {/* Header Quốc hiệu / Đơn vị */}
        <div style={{ borderBottom: '2px solid var(--border, #cbd5e1)', paddingBottom: '12px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)' }}>
            BỘ CÔNG THƯƠNG — ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
            TRUNG TÂM CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG (HaUI ICT)
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '12px 0 4px', textTransform: 'uppercase', color: 'var(--accent, #0284c7)' }}>
            BIÊN BẢN NGHIỆM THU DỊCH VỤ KỸ THUẬT HIỆN TRƯỜNG
          </h2>
          <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted, #64748b)' }}>
            Mã biên bản: <strong style={{ color: 'var(--text)' }}>{workOrderCode}</strong> — Ngày in: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>

        {/* 1. Thông tin sự cố */}
        <div style={{ background: 'var(--surface-2, #f1f5f9)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border, #e2e8f0)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text, #0f172a)' }}>1. THÔNG TIN SỰ CỐ & THIẾT BỊ</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Tiêu đề:</span> <strong style={{ color: 'var(--text)' }}>{ticket.title}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Mã phiếu:</span> <strong style={{ color: 'var(--text)' }}>{ticket.ticket_number || ticket.id}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Danh mục:</span> <strong style={{ color: 'var(--text)' }}>{categoryMeta(ticket.category).label}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Mức ưu tiên:</span> <strong style={{ color: 'var(--text)' }}>{priorityMeta(ticket.priority).label}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Vị trí hiện trường:</span> <strong style={{ color: 'var(--text)' }}>{ticket.customer_location || 'Khuôn viên HaUI Campus'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Trạng thái:</span> <strong style={{ color: 'var(--text)' }}>{statusMeta(ticket.status).label}</strong></div>
          </div>
          {ticket.description && (
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mô tả chi tiết:</span> <span style={{ color: 'var(--text)' }}>{ticket.description}</span>
            </div>
          )}
        </div>

        {/* 2. Thông tin thực hiện & SLA */}
        <div style={{ background: 'var(--surface-2, #f1f5f9)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border, #e2e8f0)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text, #0f172a)' }}>2. KẾT QUẢ XỬ LÝ & ĐÁNH GIÁ SLA</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Người yêu cầu:</span> <strong style={{ color: 'var(--text)' }}>{ticket.customer_name || 'Khách hàng'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Email liên hệ:</span> <strong style={{ color: 'var(--text)' }}>{ticket.customer_email || '-'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Kỹ thuật viên xử lý:</span> <strong style={{ color: 'var(--text)' }}>{ticket.technician_name || 'Chưa phân công'}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Thời điểm tạo:</span> <strong style={{ color: 'var(--text)' }}>{formatDate(ticket.created_at, true)}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Thời điểm cập nhật:</span> <strong style={{ color: 'var(--text)' }}>{formatDate(ticket.updated_at, true)}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Cam kết SLA:</span> <span style={{ color: slaColor, fontWeight: 'bold' }}>{slaLabel}</span></div>
          </div>
        </div>

        {/* 3. Con dấu số & Mã QR kiểm chứng */}
        <div style={{ background: 'var(--surface-2, #f1f5f9)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border, #e2e8f0)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: '#ffffff', padding: '6px', borderRadius: '4px', border: '1px solid var(--border, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QRCodeSVG value={verifyUrl} size={80} level="M" />
          </div>
          <div style={{ flex: 1, fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text, #0f172a)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--success, #16a34a)" /> 3. XÁC THỰC ĐIỆN TỬ & NIÊM PHONG SỐ
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Mã niêm phong:</span>{' '}
              <strong style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--accent, #0284c7)' }}>
                {ticket.seal_code || 'NIÊM-PHONG-ĐANG-XỬ-LÝ'}
              </strong>
            </div>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Quét mã QR bằng điện thoại để kiểm chứng tính toàn vẹn và chứng chỉ nghiệm thu số trực tiếp tại Cổng Xác thực HaUI ICT.
            </div>
            <div>
              <a
                href={verifyUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent, #0284c7)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}
              >
                Mở cổng kiểm chứng công khai <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Khung chữ ký nghiệm thu */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>ĐẠI DIỆN BÊN YÊU CẦU</div>
            <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted, #64748b)' }}>(Ký và ghi rõ họ tên)</div>
            <div style={{ height: '50px' }}></div>
            <div style={{ fontWeight: '500', color: 'var(--text)' }}>{ticket.customer_name || 'Khách hàng'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>KỸ THUẬT VIÊN THỰC HIỆN</div>
            <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted, #64748b)' }}>(Ký và xác nhận hoàn tất)</div>
            <div style={{ height: '50px' }}></div>
            <div style={{ fontWeight: '500', color: 'var(--text)' }}>{ticket.technician_name || 'Kỹ thuật viên'}</div>
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
