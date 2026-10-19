// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { navFor, isActive } from './nav';
import { pickRole } from './auth';

describe('nav', () => {
  it('manager sees dashboard, customer does not', () => {
    expect(navFor('manager').map((i) => i.path)).toContain('/');
    expect(navFor('customer').map((i) => i.path)).not.toContain('/');
    expect(navFor(null)).toEqual([]);
  });
  it('active matches child routes', () => {
    expect(isActive('/tickets', '/tickets/123')).toBe(true);
    expect(isActive('/', '/tickets')).toBe(false);
    expect(isActive('/tickets', '/ticketsX')).toBe(false);
  });
});

describe('pickRole', () => {
  it('picks highest role, defaults to customer', () => {
    expect(pickRole(['offline_access', 'technician', 'manager'])).toBe('manager');
    expect(pickRole(['uma_authorization'])).toBe('customer');
    expect(pickRole()).toBe('customer');
  });
});
