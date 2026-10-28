// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from './Login';

const h = vi.hoisted(() => ({ init: vi.fn(), login: vi.fn() }));
vi.mock('../lib/auth', () => ({ initKeycloak: () => h.init(), login: () => h.login() }));

function setup() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>app-home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  h.init.mockReset();
  h.login.mockReset();
});

describe('Login', () => {
  it('shows the sign-in card with a single primary action and sets the page title', async () => {
    h.init.mockResolvedValue(false);
    setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeInTheDocument();
    expect(document.title).toBe('Đăng nhập — FixFlow');
    expect(await screen.findByRole('button', { name: 'Đăng nhập với SSO' })).toBeEnabled();
  });

  it('keeps the button disabled until Keycloak is initialised', async () => {
    let resolve!: (v: boolean) => void;
    h.init.mockReturnValue(new Promise<boolean>((r) => (resolve = r)));
    setup();
    expect(screen.getByRole('button', { name: 'Đăng nhập với SSO' })).toBeDisabled();
    resolve(false);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đăng nhập với SSO' })).toBeEnabled());
  });

  it('clicking the button starts the SSO redirect and shows a loading state', async () => {
    h.init.mockResolvedValue(false);
    setup();
    const btn = await screen.findByRole('button', { name: 'Đăng nhập với SSO' });
    await waitFor(() => expect(btn).toBeEnabled());
    fireEvent.click(btn);
    expect(h.login).toHaveBeenCalledTimes(1);
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('redirects an already authenticated user to the app', async () => {
    h.init.mockResolvedValue(true);
    setup();
    expect(await screen.findByText('app-home')).toBeInTheDocument();
  });

  it('still lets the user try when Keycloak init fails', async () => {
    h.init.mockRejectedValue(new Error('down'));
    setup();
    expect(await screen.findByRole('button', { name: 'Đăng nhập với SSO' })).toBeEnabled();
  });

  it('offers the language switcher', async () => {
    h.init.mockResolvedValue(false);
    setup();
    expect(await screen.findByRole('button', { name: 'Tiếng Việt' })).toHaveAttribute('aria-pressed', 'true');
  });
});
