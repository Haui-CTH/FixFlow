// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '../ui/Tabs';
import { recommendTechnician } from './AssignModal';
import { SlaProgress, slaPercent } from './SlaProgress';
import type { Technician } from '../../lib/api';

const tech = (id: string, specialty: string[], load: number, max = 5, available = true): Technician => ({
  id,
  user_id: id,
  full_name: id,
  specialty,
  current_load: load,
  max_concurrent_tickets: max,
  is_available: available,
});

describe('recommendTechnician', () => {
  it('prefers matching specialty, then lowest load', () => {
    const list = [tech('a', ['software'], 0), tech('b', ['hardware'], 3), tech('c', ['hardware'], 1)];
    expect(recommendTechnician(list, 'hardware')).toBe('c');
  });
  it('skips unavailable or full technicians; null when nobody can take it', () => {
    expect(recommendTechnician([tech('a', ['hardware'], 5), tech('b', ['hardware'], 0, 5, false)], 'hardware')).toBeNull();
    expect(recommendTechnician([tech('a', ['software'], 1), tech('b', ['hardware'], 5)], 'hardware')).toBe('a');
  });
});

describe('Tabs', () => {
  const tabs = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B', count: 3 },
    { id: 'c', label: 'C' },
  ];
  it('arrow keys move selection and wrap; only the active tab is tabbable', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="a" onChange={onChange} />);
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: /B/ })).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'A' }), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('c');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'A' }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('b');
  });
});

describe('SlaProgress', () => {
  const now = Date.parse('2026-01-02T12:00:00Z');
  it('computes percent and exposes a progressbar with text', () => {
    const t = { created_at: '2026-01-02T10:00:00Z', sla_deadline: '2026-01-02T14:00:00Z' };
    expect(slaPercent(t, now)).toBe(50);
    render(<SlaProgress ticket={{ ...t, id: '1', ticket_number: 'x', title: 't', status: 'new', priority: 'low', category: 'other' }} now={now} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText(/còn 2 giờ/)).toBeInTheDocument();
  });
  it('renders nothing for finished tickets', () => {
    const { container } = render(
      <SlaProgress
        ticket={{ id: '1', ticket_number: 'x', title: 't', status: 'closed', priority: 'low', category: 'other', created_at: '2026-01-02T10:00:00Z', sla_deadline: '2026-01-02T14:00:00Z' }}
        now={now}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
