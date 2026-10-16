// SPDX-License-Identifier: Apache-2.0
// DX-FSM Notifications helpers tests (F5.2)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  notificationsApi,
  formatRelativeTime,
  getTypeIcon,
  getTypeColor,
} from './notifications';

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-01-15T12:00:00Z').getTime();
  beforeEach(() => {
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats seconds ago', () => {
    const past = new Date(NOW - 30_000).toISOString();
    expect(formatRelativeTime(past)).toBe('30s ago');
  });

  it('formats minutes ago', () => {
    const past = new Date(NOW - 5 * 60_000).toISOString();
    expect(formatRelativeTime(past)).toBe('5m ago');
  });

  it('formats hours ago', () => {
    const past = new Date(NOW - 3 * 3600_000).toISOString();
    expect(formatRelativeTime(past)).toBe('3h ago');
  });

  it('formats days ago (under 7)', () => {
    const past = new Date(NOW - 2 * 86400_000).toISOString();
    expect(formatRelativeTime(past)).toBe('2d ago');
  });

  it('falls back to date for >7 days', () => {
    const past = new Date(NOW - 14 * 86400_000).toISOString();
    const result = formatRelativeTime(past);
    // Should be a locale date string, not relative
    expect(result).not.toMatch(/ago/);
  });
});

describe('getTypeIcon', () => {
  it('returns check for success', () => {
    expect(getTypeIcon('success')).toBe('✓');
  });
  it('returns bang for warning', () => {
    expect(getTypeIcon('warning')).toBe('!');
  });
  it('returns X for error', () => {
    expect(getTypeIcon('error')).toBe('✕');
  });
  it('returns i for info', () => {
    expect(getTypeIcon('info')).toBe('i');
  });
});

describe('getTypeColor', () => {
  it('returns green for success', () => {
    expect(getTypeColor('success')).toBe('#10b981');
  });
  it('returns yellow for warning', () => {
    expect(getTypeColor('warning')).toBe('#f59e0b');
  });
  it('returns red for error', () => {
    expect(getTypeColor('error')).toBe('#ef4444');
  });
  it('returns blue for info', () => {
    expect(getTypeColor('info')).toBe('#3b82f6');
  });
});

describe('notificationsApi.list (mock)', () => {
  it('returns paginated list with unread_count', async () => {
    const result = await notificationsApi.list({ limit: 10, offset: 0 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.unread_count).toBeGreaterThanOrEqual(0);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it('filters by is_read=false', async () => {
    const result = await notificationsApi.list({ is_read: false });
    for (const item of result.items) {
      expect(item.is_read).toBe(false);
    }
  });

  it('filters by is_read=true', async () => {
    const result = await notificationsApi.list({ is_read: true });
    for (const item of result.items) {
      expect(item.is_read).toBe(true);
    }
  });

  it('returns newest first', async () => {
    const result = await notificationsApi.list({ limit: 20 });
    for (let i = 0; i < result.items.length - 1; i++) {
      const a = new Date(result.items[i].created_at).getTime();
      const b = new Date(result.items[i + 1].created_at).getTime();
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it('paginates correctly', async () => {
    const page1 = await notificationsApi.list({ limit: 2, offset: 0 });
    const page2 = await notificationsApi.list({ limit: 2, offset: 2 });
    expect(page1.items[0].id).not.toBe(page2.items[0].id);
  });
});

describe('notificationsApi.markRead', () => {
  it('returns read state with timestamp', async () => {
    const result = await notificationsApi.markRead('test-id');
    expect(result.id).toBe('test-id');
    expect(result.is_read).toBe(true);
    expect(result.read_at).toBeTruthy();
  });
});

describe('notificationsApi.markAllRead', () => {
  it('returns marked count', async () => {
    const result = await notificationsApi.markAllRead();
    expect(typeof result.marked).toBe('number');
  });
});
