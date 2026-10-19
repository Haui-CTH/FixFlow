// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { actionsFor } from './ticket-transitions';

const keys = (a: ReturnType<typeof actionsFor>) => a.map((x) => x.key);

describe('actionsFor', () => {
  it('manager: assign/cancel on new, close on resolved, none on final states', () => {
    expect(keys(actionsFor({ role: 'manager', status: 'new' }))).toEqual(['assign', 'cancel']);
    expect(actionsFor({ role: 'manager', status: 'resolved' })[0]).toMatchObject({ to: 'closed', primary: true });
    expect(actionsFor({ role: 'admin', status: 'closed' })).toEqual([]);
    expect(actionsFor({ role: 'manager', status: 'cancelled' })).toEqual([]);
  });
  it('technician can take a new ticket', () => {
    expect(actionsFor({ role: 'technician', status: 'new' })[0]).toMatchObject({ takeSelf: true });
  });
  it('technician only acts on own tickets and cannot cancel/close/reassign', () => {
    expect(actionsFor({ role: 'technician', status: 'assigned', isMine: false })).toEqual([]);
    expect(keys(actionsFor({ role: 'technician', status: 'assigned', isMine: true }))).toEqual(['start']);
    expect(keys(actionsFor({ role: 'technician', status: 'in_progress', isMine: true }))).toEqual(['resolve', 'pause']);
    expect(keys(actionsFor({ role: 'technician', status: 'pending', isMine: true }))).toEqual(['resume', 'resolve']);
    expect(actionsFor({ role: 'technician', status: 'resolved', isMine: true })).toEqual([]);
  });
  it('customer: close/reopen only on own resolved ticket', () => {
    expect(keys(actionsFor({ role: 'customer', status: 'resolved', isOwner: true }))).toEqual(['close', 'reopen']);
    expect(actionsFor({ role: 'customer', status: 'resolved', isOwner: false })).toEqual([]);
    expect(actionsFor({ role: 'customer', status: 'in_progress', isOwner: true })).toEqual([]);
  });
  it('destructive actions ask for confirmation', () => {
    const a = actionsFor({ role: 'manager', status: 'new' });
    expect(a.find((x) => x.key === 'cancel')?.confirm).toBeTruthy();
  });
  it('unknown role gets nothing', () => {
    expect(actionsFor({ role: null, status: 'new' })).toEqual([]);
  });
});
