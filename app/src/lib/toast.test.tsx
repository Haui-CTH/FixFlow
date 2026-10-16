// SPDX-License-Identifier: Apache-2.0
// DX-FSM Toast API tests (F5.6)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast, toastApi } from './toast';

describe('toastApi (module-level)', () => {
  beforeEach(() => {
    toastApi.clear();
  });

  it('success adds a toast', async () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    toastApi.success('Item saved');
    await waitFor(() => {
      expect(screen.getByText('Item saved')).toBeInTheDocument();
    });
  });

  it('error adds a toast with red icon variant', async () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    toastApi.error('Something went wrong');
    await waitFor(() => {
      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('warning + info use status role', async () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    toastApi.warning('Be careful');
    toastApi.info('FYI');
    await waitFor(() => {
      const statuses = screen.getAllByRole('status');
      expect(statuses.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders title when provided', async () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    toastApi.success('Saved', 'Success');
    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  it('dismiss removes toast', async () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    const id = toastApi.success('To be removed');
    await waitFor(() => {
      expect(screen.getByText('To be removed')).toBeInTheDocument();
    });
    act(() => {
      toastApi.dismiss(id);
    });
    await waitFor(() => {
      expect(screen.queryByText('To be removed')).not.toBeInTheDocument();
    });
  });

  it('clear removes all toasts', async () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    toastApi.success('A');
    toastApi.info('B');
    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });
    act(() => {
      toastApi.clear();
    });
    await waitFor(() => {
      expect(screen.queryByText('A')).not.toBeInTheDocument();
      expect(screen.queryByText('B')).not.toBeInTheDocument();
    });
  });

  it('close button removes toast', async () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    toastApi.info('Click to close');
    await waitFor(() => {
      expect(screen.getByText('Click to close')).toBeInTheDocument();
    });
    act(() => {
      screen.getByLabelText('Đóng thông báo').click();
    });
    await waitFor(() => {
      expect(screen.queryByText('Click to close')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses after durationMs', async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    toastApi.success('Will disappear', undefined);
    // Use real waitFor to flush microtasks, then advance fake timers
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    // After 5s (default success duration is 4000), toast should be gone
    expect(screen.queryByText('Will disappear')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe('useToast hook', () => {
  it('returns context value when inside provider', () => {
    let hookValue: any = null;
    const Capture = () => {
      hookValue = useToast();
      return null;
    };
    render(
      <ToastProvider>
        <Capture />
      </ToastProvider>
    );
    expect(hookValue).toBeTruthy();
    expect(typeof hookValue.success).toBe('function');
    expect(typeof hookValue.dismiss).toBe('function');
  });

  it('returns fallback when outside provider', () => {
    let hookValue: any = null;
    const Capture = () => {
      hookValue = useToast();
      return null;
    };
    render(<Capture />);
    expect(hookValue).toBeTruthy();
    expect(typeof hookValue.success).toBe('function');
  });
});
