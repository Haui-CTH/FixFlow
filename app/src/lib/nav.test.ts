// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { navFor, isActive, homeFor } from './nav';
import { pickRole } from './auth';

describe('nav', () => {
  it('manager sees dashboard, customer does not', () => {
    expect(navFor('manager').map((i) => i.path)).toContain('/');
    expect(navFor('customer').map((i) => i.path)).not.toContain('/');
    expect(navFor(null)).toEqual([]);
  });
  it('technician and customer get my-tickets, not all tickets', () => {
    expect(navFor('technician').map((i) => i.path)).toEqual(['/my-tickets', '/notifications']);
    expect(navFor('manager').map((i) => i.path)).toContain('/tickets');
    expect(navFor('manager').map((i) => i.path)).not.toContain('/my-tickets');
  });
  it('homeFor by role', () => {
    expect(homeFor('admin')).toBe('/');
    expect(homeFor('customer')).toBe('/my-tickets');
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
