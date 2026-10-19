// SPDX-License-Identifier: Apache-2.0
// DX-FSM Dashboard – SLAPanel component tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SLAPanel } from './SLAPanel';
import type { SLAStats } from '../../lib/api';

const baseSla: SLAStats = {
  total_active: 50,
  on_time: 40,
  breached: 5,
  met: 30,
  not_met: 10,
  breach_rate: 0.1875, // 18.75%
};

describe('SLAPanel', () => {
  it('renders section title', () => {
    render(<SLAPanel sla={baseSla} />);
    expect(screen.getByText('Hiệu suất SLA')).toBeInTheDocument();
  });

  it('displays breach rate as percentage', () => {
    render(<SLAPanel sla={baseSla} />);
    // 0.1875 → 18.8% (toFixed(1))
    expect(screen.getByText(/18\.8%/)).toBeInTheDocument();
  });

  it('renders all stats rows', () => {
    render(<SLAPanel sla={baseSla} />);
    expect(screen.getByText('Ticket đang xử lý')).toBeInTheDocument();
    expect(screen.getByText('Đúng hạn')).toBeInTheDocument();
    expect(screen.getByText('Quá hạn (đang xử lý)')).toBeInTheDocument();
    expect(screen.getByText('Đạt SLA (đã giải quyết/đóng)')).toBeInTheDocument();
    expect(screen.getByText('Không đạt SLA')).toBeInTheDocument();
  });

  it('shows numeric values', () => {
    render(<SLAPanel sla={baseSla} />);
    expect(screen.getByText('50')).toBeInTheDocument(); // total_active
    expect(screen.getByText('40')).toBeInTheDocument(); // on_time
    expect(screen.getByText('5')).toBeInTheDocument();  // breached
    expect(screen.getByText('30')).toBeInTheDocument(); // met
    expect(screen.getByText('10')).toBeInTheDocument(); // not_met
  });

  it('handles zero breach rate (good)', () => {
    const zeroSla: SLAStats = { ...baseSla, breach_rate: 0 };
    render(<SLAPanel sla={zeroSla} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles high breach rate (bad)', () => {
    const badSla: SLAStats = { ...baseSla, breach_rate: 0.5 };
    render(<SLAPanel sla={badSla} />);
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });
});
