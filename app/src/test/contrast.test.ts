// SPDX-License-Identifier: Apache-2.0
// Automated Color Contrast Test according to WCAG 2.2 Level AA guidelines.
// Ensures text has at least 4.5:1 contrast against its background.

import { describe, it, expect } from 'vitest';

export const LIGHT_THEME_TOKENS = {
  surface: '#ffffff',
  text: '#020617',
  textMuted: '#475569',
  accent: '#0369a1',
  success: '#15803d',
  warning: '#b45309',
  danger: '#b91c1c',
  primary: '#0f172a',
  onPrimary: '#ffffff',
};

export const DARK_THEME_TOKENS = {
  surface: '#111a2e',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  accent: '#38bdf8',
  onAccent: '#04283d',
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function channelLuminance(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('WCAG 2.2 AA Color Contrast Compliance', () => {
  describe('Light Theme Tokens', () => {
    const { surface, text, textMuted, accent, success, warning, danger, primary, onPrimary } = LIGHT_THEME_TOKENS;

    it('text on surface meets WCAG AA (>= 4.5:1)', () => {
      const ratio = contrastRatio(text, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('text-muted on surface meets WCAG AA (>= 4.5:1)', () => {
      const ratio = contrastRatio(textMuted, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('on-primary on primary button meets WCAG AA (>= 4.5:1)', () => {
      const ratio = contrastRatio(onPrimary, primary);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('accent link/action on surface meets WCAG AA (>= 4.5:1)', () => {
      const ratio = contrastRatio(accent, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('semantic badges (success, warning, danger) on surface meet WCAG AA (>= 4.5:1)', () => {
      expect(contrastRatio(success, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(warning, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(danger, surface)).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Dark Theme Tokens', () => {
    const { surface, text, textMuted, accent, onAccent } = DARK_THEME_TOKENS;

    it('dark mode text on surface meets WCAG AA (>= 4.5:1)', () => {
      const ratio = contrastRatio(text, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('dark mode text-muted on surface meets WCAG AA (>= 4.5:1)', () => {
      const ratio = contrastRatio(textMuted, surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it('dark mode accent on on-accent meets WCAG AA (>= 4.5:1)', () => {
      const ratio = contrastRatio(accent, onAccent);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});

