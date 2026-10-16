// SPDX-License-Identifier: Apache-2.0
// DX-FSM Dashboard – OutboxPanel component tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OutboxPanel } from './OutboxPanel';
import type { OutboxHealth } from '../../lib/api';

const baseOutbox: OutboxHealth = {
  pending: 10,
  sending: 2,
  sent: 100,
  failed: 3,
  oldest_pending_age_sec: 120, // 2m
};

describe('OutboxPanel', () => {
  it('renders section title', () => {
    render(<OutboxPanel outbox={baseOutbox} />);
    expect(screen.getByText('Outbox Worker')).toBeInTheDocument();
  });

  it('shows all status counts', () => {
    render(<OutboxPanel outbox={baseOutbox} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Sending')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('formats age in seconds', () => {
    render(<OutboxPanel outbox={baseOutbox} />);
    expect(screen.getByText(/Oldest pending: 2m/)).toBeInTheDocument();
  });

  it('formats age in hours', () => {
    const hours: OutboxHealth = { ...baseOutbox, oldest_pending_age_sec: 3600 };
    render(<OutboxPanel outbox={hours} />);
    expect(screen.getByText(/Oldest pending: 1h/)).toBeInTheDocument();
  });

  it('shows dash for null age', () => {
    const noPending: OutboxHealth = { ...baseOutbox, oldest_pending_age_sec: null };
    render(<OutboxPanel outbox={noPending} />);
    expect(screen.getByText(/Oldest pending: —/)).toBeInTheDocument();
  });

  it('formats age in days', () => {
    const days: OutboxHealth = { ...baseOutbox, oldest_pending_age_sec: 86400 * 3 };
    render(<OutboxPanel outbox={days} />);
    expect(screen.getByText(/Oldest pending: 3d/)).toBeInTheDocument();
  });
});
