// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { slaInfo } from './sla';

const H = 3600_000;
const now = Date.parse('2026-01-02T12:00:00Z');
const iso = (offsetH: number) => new Date(now + offsetH * H).toISOString();

describe('slaInfo', () => {
  it('ok when plenty of time left', () => {
    expect(slaInfo(iso(9), 'new', iso(-1), now)).toEqual({ level: 'ok', text: 'còn 9 giờ' });
  });
  it('warning under 25% of total time', () => {
    expect(slaInfo(iso(2), 'in_progress', iso(-8), now)).toEqual({ level: 'warning', text: 'còn 2 giờ' });
  });
  it('overdue', () => {
    expect(slaInfo(iso(-2), 'assigned', iso(-8), now)).toEqual({ level: 'overdue', text: 'quá 2 giờ' });
  });
  it('minutes and days', () => {
    expect(slaInfo(new Date(now + 30 * 60000).toISOString(), 'new', iso(-1), now)?.text).toBe('còn 30 phút');
    expect(slaInfo(iso(72), 'new', iso(0), now)?.text).toBe('còn 3 ngày');
  });
  it('hidden for finished tickets or no deadline', () => {
    expect(slaInfo(iso(5), 'closed', iso(-1), now)).toBeNull();
    expect(slaInfo(null, 'new', iso(-1), now)).toBeNull();
  });
});
