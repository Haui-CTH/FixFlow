// SPDX-License-Identifier: Apache-2.0
// DX-FSM Notifications helpers tests (F5.2)

import { describe, it, expect } from 'vitest';
import { notificationsApi } from './notifications';

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
