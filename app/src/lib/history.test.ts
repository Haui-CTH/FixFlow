// SPDX-License-Identifier: Apache-2.0
// DX-FSM History helpers tests (F5.4)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getActionColor,
  getActionIcon,
  describeEvent,
  formatHistoryTime,
  formatHistoryFullTime,
  type HistoryEvent,
} from './history';

describe('getActionColor', () => {
  it('returns blue for created', () => {
    expect(getActionColor('created')).toBe('var(--info)');
  });
  it('returns red for sla_breached', () => {
    expect(getActionColor('sla_breached')).toBe('var(--danger)');
  });
  it('returns green for resolved/sla_met', () => {
    expect(getActionColor('resolved')).toBe('var(--success)');
    expect(getActionColor('sla_met')).toBe('var(--success)');
  });
  it('returns gray for unknown', () => {
    expect(getActionColor('mystery_action')).toBe('var(--text-muted)');
  });
  it('handles 14+ action types with valid colors', () => {
    const actions = [
      'created', 'status_changed', 'assigned', 'unassigned',
      'priority_changed', 'category_changed', 'sla_breached', 'sla_met',
      'note_added', 'comment_added', 'updated', 'resolved', 'closed',
      'reopened',
    ];
    for (const a of actions) {
      expect(getActionColor(a)).toMatch(/^var\(--[a-z-]+\)$/);
    }
  });
});

describe('getActionIcon', () => {
  it('returns + for created', () => {
    expect(getActionIcon('created')).toBe('+');
  });
  it('returns ! for sla_breached', () => {
    expect(getActionIcon('sla_breached')).toBe('!');
  });
  it('returns ✓ for resolved', () => {
    expect(getActionIcon('resolved')).toBe('✓');
  });
  it('returns • for unknown', () => {
    expect(getActionIcon('mystery')).toBe('•');
  });
});

const baseActor = { id: 'u1', username: 'alice', full_name: 'Alice Nguyen' };

function makeEvent(overrides: Partial<HistoryEvent>): HistoryEvent {
  return {
    id: 'e1',
    action: 'updated',
    actor: baseActor,
    old_value: null,
    new_value: null,
    metadata: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('describeEvent', () => {
  it('formats created', () => {
    expect(describeEvent(makeEvent({ action: 'created' })))
      .toBe('Alice Nguyen tạo ticket');
  });

  it('formats status_changed with values', () => {
    expect(describeEvent(makeEvent({
      action: 'status_changed',
      old_value: 'new',
      new_value: 'in_progress',
    }))).toBe('Alice Nguyen đổi trạng thái: new → in_progress');
  });

  it('formats assigned', () => {
    expect(describeEvent(makeEvent({
      action: 'assigned',
      new_value: 'Bob Tran',
    }))).toBe('Alice Nguyen gán cho Bob Tran');
  });

  it('formats sla_breached with overdue minutes', () => {
    const result = describeEvent(makeEvent({
      action: 'sla_breached',
      metadata: { overdue_minutes: 5 },
    }));
    expect(result).toMatch(/SLA breach/);
    expect(result).toMatch(/5m/);
  });

  it('falls back to username when no full_name', () => {
    const result = describeEvent(makeEvent({
      action: 'created',
      actor: { id: 'u1', username: 'alice', full_name: null },
    }));
    expect(result).toBe('alice tạo ticket');
  });

  it('uses "Hệ thống" when no actor', () => {
    const result = describeEvent(makeEvent({
      action: 'created',
      actor: null,
    }));
    expect(result).toMatch(/Hệ thống/);
  });

  it('formats note_added', () => {
    expect(describeEvent(makeEvent({ action: 'note_added' })))
      .toBe('Alice Nguyen thêm note nội bộ');
  });

  it('formats comment_added', () => {
    expect(describeEvent(makeEvent({ action: 'comment_added' })))
      .toBe('Alice Nguyen thêm bình luận');
  });

  it('formats closed', () => {
    expect(describeEvent(makeEvent({ action: 'closed' })))
      .toBe('Alice Nguyen đóng ticket');
  });

  it('formats reopened', () => {
    expect(describeEvent(makeEvent({ action: 'reopened' })))
      .toBe('Alice Nguyen mở lại ticket');
  });

  it('handles unknown action with old/new', () => {
    const result = describeEvent(makeEvent({
      action: 'custom_thing',
      old_value: 'A',
      new_value: 'B',
    }));
    expect(result).toMatch(/custom_thing/);
    expect(result).toMatch(/A.*B/);
  });
});

describe('formatHistoryTime', () => {
  const NOW = new Date('2026-01-15T12:00:00Z').getTime();
  beforeEach(() => {
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "vừa xong" for < 1 min', () => {
    const past = new Date(NOW - 30_000).toISOString();
    expect(formatHistoryTime(past)).toBe('vừa xong');
  });
  it('formats minutes', () => {
    const past = new Date(NOW - 5 * 60_000).toISOString();
    expect(formatHistoryTime(past)).toMatch(/5m trước/);
  });
  it('formats hours', () => {
    const past = new Date(NOW - 2 * 3600_000).toISOString();
    expect(formatHistoryTime(past)).toMatch(/2h trước/);
  });
  it('formats days (under 7)', () => {
    const past = new Date(NOW - 2 * 86400_000).toISOString();
    expect(formatHistoryTime(past)).toMatch(/2d trước/);
  });
  it('falls back to date for >7 days', () => {
    const past = new Date(NOW - 14 * 86400_000).toISOString();
    const result = formatHistoryTime(past);
    expect(result).not.toMatch(/trước/);
  });
});

describe('formatHistoryFullTime', () => {
  it('returns formatted string', () => {
    const iso = '2026-01-15T10:30:00Z';
    const result = formatHistoryFullTime(iso);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
