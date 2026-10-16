// SPDX-License-Identifier: Apache-2.0
// DX-FSM Dashboard – DistributionBar component tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DistributionBar } from './DistributionBar';

describe('DistributionBar', () => {
  it('renders label and count', () => {
    render(<DistributionBar label="urgent" count={5} total={10} />);
    expect(screen.getByText('urgent')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('computes correct width percentage', () => {
    const { container } = render(
      <DistributionBar label="high" count={25} total={100} />
    );
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar).toBeInTheDocument();
    expect(bar.style.width).toBe('25%');
  });

  it('caps width at 100% when count > total', () => {
    const { container } = render(
      <DistributionBar label="edge" count={150} total={100} />
    );
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.style.width).toBe('100%');
  });

  it('handles zero total without dividing by zero', () => {
    const { container } = render(
      <DistributionBar label="zero" count={0} total={0} />
    );
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.style.width).toBe('0%');
  });

  it('has correct ARIA attributes', () => {
    const { container } = render(
      <DistributionBar label="medium" count={7} total={20} />
    );
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.getAttribute('aria-valuenow')).toBe('7');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('20');
  });
});
