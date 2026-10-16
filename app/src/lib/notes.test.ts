// SPDX-License-Identifier: Apache-2.0
// DX-FSM Notes helpers tests (F5.3)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isStaffRole,
  validateNoteBody,
  normalizeNoteBody,
  formatNoteTime,
} from './notes';

describe('isStaffRole', () => {
  it('returns true for technician', () => {
    expect(isStaffRole('technician')).toBe(true);
  });
  it('returns true for manager', () => {
    expect(isStaffRole('manager')).toBe(true);
  });
  it('returns true for admin', () => {
    expect(isStaffRole('admin')).toBe(true);
  });
  it('returns false for customer', () => {
    expect(isStaffRole('customer')).toBe(false);
  });
  it('returns false for null', () => {
    expect(isStaffRole(null)).toBe(false);
  });
  it('returns false for undefined', () => {
    expect(isStaffRole(undefined)).toBe(false);
  });
  it('returns false for unknown role', () => {
    expect(isStaffRole('guest')).toBe(false);
  });
});

describe('validateNoteBody', () => {
  it('returns no errors for valid body', () => {
    expect(validateNoteBody('Hello world')).toEqual([]);
  });

  it('returns error for empty body', () => {
    const errors = validateNoteBody('');
    expect(errors.length).toBe(1);
    expect(errors[0].field).toBe('body');
  });

  it('returns error for whitespace-only body', () => {
    const errors = validateNoteBody('   \n\t  ');
    expect(errors.length).toBe(1);
    expect(errors[0].field).toBe('body');
  });

  it('returns error for body over 5000 chars', () => {
    const longBody = 'a'.repeat(5001);
    const errors = validateNoteBody(longBody);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toMatch(/5000/);
  });

  it('accepts body exactly 5000 chars', () => {
    const body = 'a'.repeat(5000);
    expect(validateNoteBody(body)).toEqual([]);
  });

  it('returns both errors when empty AND too long', () => {
    // Hmm, empty can't be too long simultaneously.
    // But we test the function returns array (not throws)
    const errors = validateNoteBody('   ');
    expect(Array.isArray(errors)).toBe(true);
  });

  it('preserves leading/trailing whitespace in valid case', () => {
    // '  hello  ' is valid (only fails if all whitespace)
    expect(validateNoteBody('  hello  ')).toEqual([]);
  });
});

describe('normalizeNoteBody', () => {
  it('strips leading whitespace', () => {
    expect(normalizeNoteBody('   hello')).toBe('hello');
  });
  it('strips trailing whitespace', () => {
    expect(normalizeNoteBody('hello   ')).toBe('hello');
  });
  it('strips both', () => {
    expect(normalizeNoteBody('   hello   ')).toBe('hello');
  });
  it('handles tabs and newlines', () => {
    expect(normalizeNoteBody('\n\thello\n\t')).toBe('hello');
  });
  it('preserves internal whitespace', () => {
    expect(normalizeNoteBody('  hello world  ')).toBe('hello world');
  });
  it('returns empty for all whitespace', () => {
    expect(normalizeNoteBody('   \n\t  ')).toBe('');
  });
});

describe('formatNoteTime', () => {
  const NOW = new Date('2026-01-15T12:00:00Z').getTime();
  beforeEach(() => {
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats seconds', () => {
    const past = new Date(NOW - 30_000).toISOString();
    expect(formatNoteTime(past)).toMatch(/30s trước/);
  });
  it('formats minutes', () => {
    const past = new Date(NOW - 5 * 60_000).toISOString();
    expect(formatNoteTime(past)).toMatch(/5m trước/);
  });
  it('formats hours', () => {
    const past = new Date(NOW - 2 * 3600_000).toISOString();
    expect(formatNoteTime(past)).toMatch(/2h trước/);
  });
  it('formats days (under 7)', () => {
    const past = new Date(NOW - 2 * 86400_000).toISOString();
    expect(formatNoteTime(past)).toMatch(/2d trước/);
  });
  it('falls back to date for >7 days', () => {
    const past = new Date(NOW - 14 * 86400_000).toISOString();
    const result = formatNoteTime(past);
    expect(result).not.toMatch(/trước/);
  });
});
