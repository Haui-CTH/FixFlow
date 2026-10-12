// DX-FSM Tickets Page
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ticketApi } from '../lib/api';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Mới', color: '#3b82f6' },
  assigned: { label: 'Đã giao', color: '#8b5cf6' },
  in_progress: { label: 'Đang xử lý', color: '#f59e0b' },
  pending: { label: 'Chờ', color: '#6b7280' },
  resolved: { label: 'Đã giải quyết', color: '#10b981' },
  closed: { label: 'Đã đóng', color: '#374151' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

export default function Tickets() {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketApi.list().then((r) => r.data),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Tickets</h1>
        <Link to="/tickets/new" style={{ background: '#4f46e5', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none' }}>
          + Tạo Ticket
        </Link>
      </div>

      {isLoading ? (
        <p>Đang tải...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Mã</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Tiêu đề</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Trạng thái</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Ưu tiên</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const status = STATUS_LABELS[ticket.status] || { label: ticket.status, color: '#6b7280' };
                return (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <Link to={`/tickets/${ticket.id}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>
                        {ticket.ticket_number}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.title}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: status.color + '20', color: status.color, padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500 }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ color: PRIORITY_COLORS[ticket.priority] || '#6b7280', fontWeight: 500 }}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('vi-VN') : '-'}
                    </td>
                  </tr>
                );
              })}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    Chưa có ticket nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
