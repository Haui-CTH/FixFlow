// SPDX-License-Identifier: Apache-2.0
// DX-FSM Layout component tests (F5.5: responsive)

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';

// Mock auth + store
vi.mock('../lib/auth', () => ({
  logout: vi.fn(),
}));

vi.mock('../lib/store', () => ({
  useAuthStore: () => ({
    user: { username: 'alice', role: 'technician' },
    logout: vi.fn(),
  }),
}));

function setup(initialPath: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Layout />
    </MemoryRouter>
  );
}

describe('Layout', () => {
  it('renders brand', () => {
    setup();
    expect(screen.getAllByText('DX-FSM').length).toBeGreaterThan(0);
  });

  it('renders nav items for the role (technician: no dashboard)', () => {
    setup();
    expect(screen.queryByRole('link', { name: 'Tổng quan' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ticket' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Thông báo' })).toBeInTheDocument();
  });

  it('marks the active nav item for child routes', () => {
    setup('/tickets/123');
    expect(screen.getByRole('link', { name: 'Ticket' })).toHaveAttribute('aria-current', 'page');
  });

  it('has a skip link and a focusable main', () => {
    setup();
    expect(screen.getByText('Bỏ qua tới nội dung chính')).toHaveAttribute('href', '#main');
    expect(document.getElementById('main')).toHaveAttribute('tabindex', '-1');
  });

  it('user menu shows username, role and logout; Esc closes it', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Tài khoản alice/ }));
    expect(screen.getByText('technician')).toBeInTheDocument();
    expect(screen.getByText(/Đăng xuất/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(/Đăng xuất/)).not.toBeInTheDocument();
  });

  it('mobile bar contains hamburger', () => {
    setup();
    expect(screen.getByLabelText('Mở menu')).toBeInTheDocument();
  });

  it('clicking hamburger opens sidebar (mobile)', async () => {
    setup();
    const hamburger = screen.getByLabelText('Mở menu');
    fireEvent.click(hamburger);
    // After click, close button should appear
    await waitFor(() => {
      expect(screen.getByLabelText('Đóng menu')).toBeInTheDocument();
    });
  });

  it('clicking close button toggles sidebar state', async () => {
    setup();
    // Open
    fireEvent.click(screen.getByLabelText('Mở menu'));
    await waitFor(() => {
      const aside = document.querySelector('aside');
      // After open, class should include 'sidebarOpen' (hashed)
      expect(aside?.className).toMatch(/sidebarOpen/);
    });

    // Close
    fireEvent.click(screen.getByLabelText('Đóng menu'));
    await waitFor(() => {
      const aside = document.querySelector('aside');
      expect(aside?.className).not.toMatch(/sidebarOpen/);
    });
  });

  it('Escape key closes sidebar', async () => {
    setup();
    fireEvent.click(screen.getByLabelText('Mở menu'));
    await waitFor(() => {
      const aside = document.querySelector('aside');
      expect(aside?.className).toMatch(/sidebarOpen/);
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      const aside = document.querySelector('aside');
      expect(aside?.className).not.toMatch(/sidebarOpen/);
    });
  });
});
