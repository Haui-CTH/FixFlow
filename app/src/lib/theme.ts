// SPDX-License-Identifier: Apache-2.0
// Theme sáng/tối (L2.4). Lưu localStorage, bọc try/catch.
// ponytail: mặc định sáng (chưa theo hệ thống) tới khi GĐ 08 rà dark mode toàn app.

export type Theme = 'light' | 'dark';
const KEY = 'dxfsm-theme';

export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
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
