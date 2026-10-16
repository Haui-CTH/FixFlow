// DX-FSM Ticket Detail Page
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../lib/api';
import { NotesPanel } from '../components/Notes/NotesPanel';
import { HistoryTimeline } from '../components/History/HistoryTimeline';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <p>Đang tải...</p>;
  if (!ticket) return <p>Ticket không tìm thấy</p>;

  return (
    <div>
      <h1>{ticket.ticket_number}</h1>
      <div style={{ marginTop: '1rem', background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{ticket.title}</h2>
        <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>{ticket.description || 'Không có mô tả'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
          <div><strong>Trạng thái:</strong> {ticket.status}</div>
          <div><strong>Ưu tiên:</strong> {ticket.priority}</div>
          <div><strong>Danh mục:</strong> {ticket.category}</div>
          <div><strong>KTV:</strong> {ticket.technician_name || 'Chưa giao'}</div>
          <div><strong>Khách hàng:</strong> {ticket.customer_name || '-'}</div>
        </div>
      </div>

      {/* F5.3: Internal notes panel (staff only, auto-hidden for customer) */}
      {id && <NotesPanel ticketId={id} />}

      {/* F5.4: History timeline (visible to all roles) */}
      {id && <HistoryTimeline ticketId={id} />}
    </div>
  );
}
