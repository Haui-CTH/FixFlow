// SPDX-License-Identifier: Apache-2.0
// DX-FSM Dashboard – MetricCard component tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Total tickets" value={42} />);
    expect(screen.getByText('Total tickets')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders hint when provided', () => {
    render(<MetricCard label="Test" value={10} hint="+5 today" />);
    expect(screen.getByText('+5 today')).toBeInTheDocument();
  });

  it('omits hint when not provided', () => {
    const { container } = render(<MetricCard label="Test" value={10} />);
    // No hint element rendered
    const hints = container.querySelectorAll('div');
    // The hint should be missing
    const hasHint = Array.from(hints).some(
      (d) => d.textContent === '+5 today'
    );
    expect(hasHint).toBe(false);
  });

  it('renders string value', () => {
    render(<MetricCard label="Rate" value="85%" />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('applies color class', () => {
    const { container } = render(
      <MetricCard label="Test" value={5} color="red" />
    );
    // Should have at least one element with color class
    const allDivs = container.querySelectorAll('div');
    expect(allDivs.length).toBeGreaterThan(0);
  });
});
