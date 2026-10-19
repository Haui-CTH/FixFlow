// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ActivityPanel } from './ActivityPanel';
import { AssigneeTable } from './AssigneeTable';
import { outboxStatus, OutboxPanel } from './OutboxPanel';
import { SLAPanel } from './SLAPanel';

const sla = (breach_rate: number) => ({ total_active: 1, on_time: 1, breached: 0, met: 0, not_met: 0, breach_rate });
const outbox = (o: Partial<Record<'pending' | 'sending' | 'sent' | 'failed', number>> = {}) => ({
  pending: 0, sending: 0, sent: 5, failed: 0, oldest_pending_age_sec: null, ...o,
});

describe('SLAPanel gauge', () => {
  it('exposes an img with the rate and level text (not color only)', () => {
    render(<SLAPanel sla={sla(0.3)} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Tỉ lệ vi phạm SLA 30.0%, mức Nguy cấp');
    expect(screen.getByText('Nguy cấp')).toBeInTheDocument();
  });
  it('levels: Tốt < 10%, Chú ý < 25%', () => {
    const { rerender } = render(<SLAPanel sla={sla(0.05)} />);
    expect(screen.getByText('Tốt')).toBeInTheDocument();
    rerender(<SLAPanel sla={sla(0.15)} />);
    expect(screen.getByText('Chú ý')).toBeInTheDocument();
  });
});

describe('Outbox status', () => {
  it('failed > pending > healthy', () => {
    expect(outboxStatus(outbox({ failed: 1, pending: 3 }))).toBe('bad');
    expect(outboxStatus(outbox({ pending: 2 }))).toBe('wait');
    expect(outboxStatus(outbox())).toBe('ok');
  });
  it('shows a text badge', () => {
    render(<OutboxPanel outbox={outbox({ failed: 2 })} />);
    expect(screen.getByText('Có lỗi')).toBeInTheDocument();
  });
});

describe('ActivityPanel', () => {
  it('shows the three 24h numbers with labels', () => {
    render(<ActivityPanel activity={{ last_24h_created: 7, last_24h_resolved: 4, last_24h_breached: 0 }} />);
    expect(screen.getByText('Tạo mới')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Vi phạm SLA')).toBeInTheDocument();
  });
});

describe('AssigneeTable sorting', () => {
  const rows = [
    { user_id: '1', username: 'a', full_name: 'An', active_tickets: 1, resolved_tickets: 9 },
    { user_id: '2', username: 'b', full_name: 'Bình', active_tickets: 5, resolved_tickets: 2 },
  ];
  const names = () => within(screen.getByRole('table')).getAllByText(/^(An|Bình)$/).map((e) => e.textContent);

  it('sorts by a column and sets aria-sort', () => {
    render(<AssigneeTable assignees={rows} />);
    expect(names()).toEqual(['An', 'Bình']);
    fireEvent.click(screen.getByRole('button', { name: /Đang xử lý/ }));
    expect(names()).toEqual(['Bình', 'An']);
    expect(screen.getByRole('columnheader', { name: /Đang xử lý/ })).toHaveAttribute('aria-sort', 'descending');
    fireEvent.click(screen.getByRole('button', { name: /Đang xử lý/ }));
    expect(names()).toEqual(['An', 'Bình']);
    expect(screen.getByRole('columnheader', { name: /Đang xử lý/ })).toHaveAttribute('aria-sort', 'ascending');
  });
});
