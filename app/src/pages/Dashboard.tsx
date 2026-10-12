// DX-FSM Dashboard Page
import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../lib/api';

export default function Dashboard() {
  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketApi.list().then((r) => r.data),
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
        <StatCard label="Tổng ticket" value={tickets.length} />
        <StatCard label="Mới" value={tickets.filter((t) => t.status === 'new').length} color="blue" />
        <StatCard label="Đang xử lý" value={tickets.filter((t) => t.status === 'in_progress').length} color="yellow" />
        <StatCard label="Đã đóng" value={tickets.filter((t) => t.status === 'closed').length} color="green" />
      </div>
      <p style={{ marginTop: '2rem', color: '#6b7280' }}>Chào mừng đến với DX-FSM Platform.</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    blue: '#3b82f6',
    yellow: '#f59e0b',
    green: '#10b981',
    red: '#ef4444',
  };
  return (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: colors[color || 'gray'] }}>{value}</div>
      <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}
