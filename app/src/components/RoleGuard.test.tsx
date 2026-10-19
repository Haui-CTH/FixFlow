// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';

let role: string | null = 'customer';
vi.mock('../hooks/useRole', () => ({ useRole: () => role }));
const warning = vi.fn();
vi.mock('../lib/toast', () => ({ toastApi: { warning: (m: string) => warning(m) } }));

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RoleGuard roles={['manager']} deniedMessage="không có quyền"><div>dash</div></RoleGuard>} />
        <Route path="/my-tickets" element={<div>mine</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RoleGuard', () => {
  it('redirects when role lacks access', () => {
    role = 'customer';
    setup();
    expect(screen.getByText('mine')).toBeInTheDocument();
  });
  it('renders children when allowed', () => {
    role = 'manager';
    setup();
    expect(screen.getByText('dash')).toBeInTheDocument();
  });
  it('shows the denied message once when redirecting', () => {
    role = 'customer';
    warning.mockClear();
    setup();
    expect(warning).toHaveBeenCalledWith('không có quyền');
  });
});
