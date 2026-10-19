// SPDX-License-Identifier: Apache-2.0
// Cấu hình điều hướng theo role (S2.2). Chỉ liệt kê route đã có trang — không để link chết.

import { Bell, LayoutDashboard, Ticket, UserCheck, type LucideIcon } from 'lucide-react';
import type { Role } from './auth';
import { t } from './i18n';

export interface NavItem {
  path: string;
  label: string; // getter: dịch theo ngôn ngữ hiện tại
  icon: LucideIcon;
  roles: Role[];
}

const item = (path: string, key: string, icon: LucideIcon, roles: Role[]): NavItem => ({
  path,
  get label() {
    return t(key);
  },
  icon,
  roles,
});

export const NAV_ITEMS: NavItem[] = [
  item('/', 'nav.dashboard', LayoutDashboard, ['admin', 'manager']),
  item('/tickets', 'nav.all_tickets', Ticket, ['admin', 'manager']),
  item('/my-tickets', 'nav.my_tickets', UserCheck, ['technician', 'customer']),
  item('/notifications', 'nav.notifications', Bell, ['admin', 'manager', 'technician', 'customer']),
];

export const navFor = (role: string | null | undefined): NavItem[] =>
  NAV_ITEMS.filter((i) => role && (i.roles as string[]).includes(role));

// Trang chủ theo role: manager/admin -> Tổng quan, còn lại -> Ticket của tôi
export const homeFor = (role: string | null | undefined): string =>
  role === 'admin' || role === 'manager' ? '/' : '/my-tickets';

// Tiêu đề trang (document.title) theo đường dẫn
export function pageTitle(pathname: string): string {
  if (pathname === '/') return t('nav.dashboard');
  if (pathname === '/tickets') return t('nav.all_tickets');
  if (pathname === '/my-tickets') return t('nav.my_tickets');
  if (pathname === '/tickets/new') return t('nav.new_ticket');
  if (pathname.startsWith('/tickets/')) return t('nav.ticket_detail');
  if (pathname === '/notifications') return t('nav.notifications');
  return t('nav.not_found');
}

// '/' chỉ khớp chính xác; các mục khác khớp cả route con (/tickets/123)
export const isActive = (itemPath: string, pathname: string): boolean =>
  itemPath === '/' ? pathname === '/' : pathname === itemPath || pathname.startsWith(itemPath + '/');
