// SPDX-License-Identifier: Apache-2.0
// DX-FSM format helpers (D1.13) — Intl only, không dùng date-fns.

const LOCALE = 'vi-VN';

type DateInput = string | number | Date | null | undefined;

const toDate = (v: DateInput): Date | null => {
  if (v == null || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function formatDate(v: DateInput, withTime = false): string {
  const d = toDate(v);
  if (!d) return '-';
  return d.toLocaleString(
    LOCALE,
    withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' },
  );
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];
const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

export function formatRelative(v: DateInput, now: number = Date.now()): string {
  const d = toDate(v);
  if (!d) return '-';
  const diff = Math.round((d.getTime() - now) / 1000);
  for (const [unit, sec] of UNITS) {
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  }
  return 'vừa xong';
}

export const formatNumber = (n: number | null | undefined): string =>
  n == null ? '-' : n.toLocaleString(LOCALE);
