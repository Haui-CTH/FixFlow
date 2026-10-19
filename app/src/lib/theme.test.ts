// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTheme, setTheme } from './theme';

const mq = (dark: boolean) => vi.stubGlobal('matchMedia', () => ({ matches: dark }));

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });
  it('defaults to the system preference', () => {
    mq(true);
    expect(getTheme()).toBe('dark');
    mq(false);
    expect(getTheme()).toBe('light');
  });
  it('a saved choice beats the system preference', () => {
    mq(true);
    setTheme('light');
    expect(getTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
  it('does not throw when storage is blocked', () => {
    mq(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getTheme()).toBe('light');
    vi.restoreAllMocks();
  });
});
