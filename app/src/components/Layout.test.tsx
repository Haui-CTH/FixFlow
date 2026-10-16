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

  it('renders all nav items', () => {
    setup();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tickets')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('shows username and role', () => {
    setup();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('technician')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    setup();
    expect(screen.getByText(/Đăng xuất/)).toBeInTheDocument();
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
