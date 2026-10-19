// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';

let role: string | null = 'customer';
vi.mock('../hooks/useRole', () => ({ useRole: () => role }));

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RoleGuard roles={['manager']}><div>dash</div></RoleGuard>} />
        <Route path="/tickets" element={<div>tickets</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RoleGuard', () => {
  it('redirects when role lacks access', () => {
    role = 'customer';
    setup();
    expect(screen.getByText('tickets')).toBeInTheDocument();
  });
  it('renders children when allowed', () => {
    role = 'manager';
    setup();
    expect(screen.getByText('dash')).toBeInTheDocument();
  });
});
