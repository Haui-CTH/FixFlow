// SPDX-License-Identifier: Apache-2.0
// Theme sáng/tối (L2.4). Lưu localStorage, bọc try/catch.
// Mặc định theo hệ thống (prefers-color-scheme) cho tới khi người dùng chọn.

export type Theme = 'light' | 'dark';
const KEY = 'dxfsm-theme';

export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage bị chặn: dùng theo hệ thống */
  }
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function setTheme(t: Theme): void {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* storage bị chặn: bỏ qua */
  }
}

export const initTheme = () => setTheme(getTheme());
