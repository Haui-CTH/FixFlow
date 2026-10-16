// SPDX-License-Identifier: Apache-2.0
// DX-FSM ErrorBoundary component tests (F5.6)

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Boom!');
  }
  return <div>Safe content</div>;
}

describe('ErrorBoundary', () => {
  // Silence console.error from React's error logging
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders fallback when child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Đã xảy ra lỗi/)).toBeInTheDocument();
    expect(screen.getByText(/Thử lại/)).toBeInTheDocument();
  });

  it('shows error details in <details>', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Chi tiết lỗi/)).toBeInTheDocument();
  });

  it('calls onError callback', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalled();
    const call = onError.mock.calls[0];
    expect(call[0].message).toBe('Boom!');
  });

  it('uses custom fallback when provided', () => {
    const customFallback = (_err: Error, reset: () => void) => (
      <div>
        <p>Custom error UI</p>
        <button onClick={reset}>Custom reset</button>
      </div>
    );
    render(
      <ErrorBoundary fallback={customFallback}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.getByText('Custom reset')).toBeInTheDocument();
  });
});
