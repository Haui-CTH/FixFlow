// SPDX-License-Identifier: Apache-2.0
// PublicVerify: Cổng Kiểm chứng Công khai Biên bản Nghiệm thu Kỹ thuật Hiện trường
// Không yêu cầu đăng nhập, hỗ trợ quét QR hoặc nhập mã phiếu để kiểm tra tính toàn vẹn.

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Lock,
  Printer,
} from 'lucide-react';
import { verifyWorkOrder, type WorkOrderVerification } from '../lib/api';
import { formatDate } from '../lib/format';
import { categoryMeta, statusMeta, priorityMeta } from '../lib/ticket-meta';
import { Button } from '../components/ui/Button';
import { SkeletonBlock } from '../components/ui/Skeleton';

export default function PublicVerify() {
  const { ticketRef: paramRef } = useParams<{ ticketRef?: string }>();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code') || '';

  const [inputRef, setInputRef] = useState(paramRef || '');
  const [inputCode, setInputCode] = useState(queryCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkOrderVerification | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const doVerify = async (ref: string, code?: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await verifyWorkOrder(ref.trim(), code?.trim());
      setResult(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setResult({
          valid: false,
          status_label: 'Không tìm thấy biên bản',
          reason: `Không tìm thấy phiếu sự cố nào khớp với mã '${ref}' trong hệ thống HaUI FixFlow.`,
          ticket_number: ref,
        });
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramRef) {
      doVerify(paramRef, queryCode);
    }
  }, [paramRef, queryCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.trim()) {
      doVerify(inputRef, inputCode);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #f8fafc)',
        color: 'var(--text, #0f172a)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        fontFamily: 'inherit',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          width: '100%',
          maxWidth: '780px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 'bold',
            }}
          >
            FF
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>FixFlow (DX-FSM)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
              Cổng Xác thực Điện tử — HaUI ICT Center
            </div>
          </div>
        </div>
        <Link to="/login" className="no-print" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Đăng nhập hệ thống
          </Button>
        </Link>
      </header>

      {/* Main Container */}
      <main style={{ width: '100%', maxWidth: '780px' }}>
        {/* Search Bar */}
        <div
          className="no-print"
          style={{
            background: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border, #e2e8f0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '24px',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
            Tra cứu & Kiểm chứng Biên bản Nghiệm thu Số
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', marginBottom: '16px' }}>
            Nhập mã phiếu (vd: <code>TKT-2026-000003</code>) và mã con dấu để kiểm chứng tính toàn vẹn mật mã học.
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px' }}>
            <input
              type="text"
              placeholder="Mã phiếu sự cố (vd: TKT-2026-000003)..."
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border, #cbd5e1)',
                background: 'var(--surface-2, #f8fafc)',
                color: 'var(--text, #0f172a)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Mã con dấu (tùy chọn)..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border, #cbd5e1)',
                background: 'var(--surface-2, #f8fafc)',
                color: 'var(--text, #0f172a)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <Button type="submit" variant="primary" disabled={loading || !inputRef.trim()}>
              <Search size={16} style={{ marginRight: '6px' }} /> Kiểm tra
            </Button>
          </form>
        </div>

        {/* Loading state */}
        {loading && <SkeletonBlock height={280} />}

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger, #ef4444)',
              color: 'var(--danger, #dc2626)',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Verification Result */}
        {!loading && result && (
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              borderRadius: '12px',
              border: `1px solid ${result.valid ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)'}`,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            {/* Certificate Header Banner */}
            <div
              style={{
                padding: '20px',
                background: result.valid
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.05))'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.05))',
                borderBottom: '1px solid var(--border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: result.valid ? '#22c55e' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                {result.valid ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: result.valid ? 'var(--success, #16a34a)' : 'var(--danger, #dc2626)',
                    marginBottom: '2px',
                  }}
                >
                  {result.valid ? 'CHỨNG NHẬN NIÊM PHONG SỐ HỢP LỆ' : 'XÁC THỰC THẤT BẠI'}
                </div>
                <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px', color: 'var(--text)' }}>
                  {result.status_label}
                </h1>
                <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                  {result.reason ||
                    'Biên bản nghiệm thu hiện trường khớp với hồ sơ lưu ký mật mã HMAC-SHA256 trong hệ thống.'}
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            {result.ticket_number && (
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    background: 'var(--surface-2, #f8fafc)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #e2e8f0)',
                    fontSize: '13px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Mã phiếu:</span>{' '}
                    <strong style={{ color: 'var(--text)' }}>{result.ticket_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Danh mục:</span>{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      {result.category ? categoryMeta(result.category).label : '-'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Mức ưu tiên:</span>{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      {result.priority ? priorityMeta(result.priority).label : '-'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Trạng thái:</span>{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      {result.status ? statusMeta(result.status).label : '-'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Kỹ thuật viên:</span>{' '}
                    <strong style={{ color: 'var(--text)' }}>{result.technician_name || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vị trí:</span>{' '}
                    <strong style={{ color: 'var(--text)' }}>{result.location || 'HaUI Campus'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Nghiệm thu lúc:</span>{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      {result.resolved_at ? formatDate(result.resolved_at, true) : 'Chưa hoàn tất'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Cam kết SLA:</span>{' '}
                    {result.sla_met === true ? (
                      <span style={{ color: 'var(--success, #16a34a)', fontWeight: 'bold' }}>
                        <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '3px' }} /> Đạt chuẩn SLA
                      </span>
                    ) : result.sla_met === false ? (
                      <span style={{ color: 'var(--danger, #dc2626)', fontWeight: 'bold' }}>
                        <XCircle size={13} style={{ display: 'inline', marginRight: '3px' }} /> Quá hạn (Trễ SLA)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Đang theo dõi</span>
                    )}
                  </div>
                </div>

                {/* Cryptographic Proof Box */}
                {result.seal_code && (
                  <div
                    style={{
                      border: '1px solid var(--border, #cbd5e1)',
                      borderRadius: '8px',
                      padding: '16px',
                      background: 'var(--surface-2, #f1f5f9)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        color: 'var(--text)',
                      }}
                    >
                      <Lock size={15} color="var(--accent, #0284c7)" /> Con dấu Điện tử & Tính Toàn vẹn Dữ liệu
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mã con dấu (HMAC Code):</span>{' '}
                      <strong
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          color: 'var(--accent, #0284c7)',
                          letterSpacing: '1px',
                        }}
                      >
                        {result.seal_code}
                      </strong>
                    </div>
                    {result.full_hash && (
                      <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Chữ ký số toàn văn:</span>{' '}
                        <code style={{ fontSize: '11px', color: 'var(--text)' }}>{result.full_hash}</code>
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Thuật toán: {result.algorithm || 'HMAC-SHA256 (RFC 2104)'} · Cơ quan xác thực:{' '}
                      {result.issued_by || 'HaUI ICT Center'}
                    </div>
                  </div>
                )}

                {/* Print button */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => window.print()}>
                    <Printer size={15} style={{ marginRight: '6px' }} /> In giấy xác nhận
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          paddingTop: '32px',
          fontSize: '12px',
          color: 'var(--text-muted, #94a3b8)',
          textAlign: 'center',
        }}
      >
        Trường Đại học Công nghiệp Hà Nội — Nền tảng Chuyển đổi số DX-OS (HaUI PMNM 2026)
      </footer>
    </div>
  );
}
