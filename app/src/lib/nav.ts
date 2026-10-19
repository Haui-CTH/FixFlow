// SPDX-License-Identifier: Apache-2.0
// Cấu hình điều hướng theo role (S2.2). Chỉ liệt kê route đã có trang — không để link chết.

import { Bell, LayoutDashboard, Ticket, UserCheck, type LucideIcon } from 'lucide-react';
import type { Role } from './auth';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Tổng quan', icon: LayoutDashboard, roles: ['admin', 'manager'] },
  { path: '/tickets', label: 'Tất cả ticket', icon: Ticket, roles: ['admin', 'manager'] },
  { path: '/my-tickets', label: 'Ticket của tôi', icon: UserCheck, roles: ['technician', 'customer'] },
  { path: '/notifications', label: 'Thông báo', icon: Bell, roles: ['admin', 'manager', 'technician', 'customer'] },
];

export const navFor = (role: string | null | undefined): NavItem[] =>
  NAV_ITEMS.filter((i) => role && (i.roles as string[]).includes(role));

// Trang chủ theo role: manager/admin -> Tổng quan, còn lại -> Ticket của tôi
export const homeFor = (role: string | null | undefined): string =>
  role === 'admin' || role === 'manager' ? '/' : '/my-tickets';

// Tiêu đề trang (document.title) theo đường dẫn
export function pageTitle(pathname: string): string {
  if (pathname === '/') return 'Tổng quan';
  if (pathname === '/tickets') return 'Tất cả ticket';
  if (pathname === '/my-tickets') return 'Ticket của tôi';
  if (pathname === '/tickets/new') return 'Tạo ticket';
  if (pathname.startsWith('/tickets/')) return 'Chi tiết ticket';
  if (pathname === '/notifications') return 'Thông báo';
  return 'Không tìm thấy trang';
}

// '/' chỉ khớp chính xác; các mục khác khớp cả route con (/tickets/123)
export const isActive = (itemPath: string, pathname: string): boolean =>
  itemPath === '/' ? pathname === '/' : pathname === itemPath || pathname.startsWith(itemPath + '/');
