// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { statusMeta, priorityMeta } from './ticket-meta';
import { formatDate, formatNumber, formatRelative } from './format';

describe('ticket-meta', () => {
  it('maps known status/priority', () => {
    expect(statusMeta('in_progress')).toMatchObject({ label: 'Đang xử lý', tone: 'warning' });
    expect(priorityMeta('urgent').tone).toBe('danger');
  });
  it('falls back to muted for unknown or empty', () => {
    expect(statusMeta('weird')).toEqual({ label: 'weird', tone: 'muted' });
    expect(priorityMeta(null).label).toBe('-');
  });
  it('treats urgent as alias of critical', () => {
    expect(priorityMeta('critical')).toEqual(priorityMeta('urgent'));
  });
});

describe('format', () => {
  it('formatDate handles null/invalid', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('not-a-date')).toBe('-');
    expect(formatDate('2026-01-02T00:00:00Z')).toMatch(/2026|26/);
  });
  it('formatRelative', () => {
    const now = Date.parse('2026-01-02T12:00:00Z');
    expect(formatRelative(now - 30_000, now)).toBe('vừa xong');
    expect(formatRelative(now - 3 * 3600_000, now)).toContain('3');
  });
  it('formatNumber', () => {
    expect(formatNumber(null)).toBe('-');
    expect(formatNumber(1234)).toMatch(/1.234/);
  });
});
