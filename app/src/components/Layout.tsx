// SPDX-License-Identifier: Apache-2.0
// DX-FSM App Layout (GĐ 02): Sidebar + TopBar + main (skip link, focus khi đổi route, ErrorBoundary theo route)

import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { logout } from '../lib/auth';
import { pageTitle } from '../lib/nav';
import { useAuthStore } from '../lib/store';
import { ErrorBoundary } from './ErrorBoundary';
import { NotificationBell } from './NotificationBell';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import styles from './Layout.module.css';
import { t } from '../lib/i18n';

const COLLAPSE_KEY = 'dxfsm-sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function Layout() {
  const { pathname } = useLocation();
  const { user, logout: doLogout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  const handleLogout = () => {
    doLogout();
    logout();
  };

  const toggleCollapse = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* storage bị chặn */
      }
      return !c;
    });

  // Đổi route: đóng drawer, cập nhật tiêu đề tab, chuyển focus vào main (không ở lần render đầu)
  useEffect(() => {
    document.title = `${pageTitle(pathname)} — DX-FSM`;
    setSidebarOpen(false);
    if (firstRender.current) firstRender.current = false;
    else mainRef.current?.focus();
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <>
      <a href="#main" className="skip-link">
        {t('layout.bo_qua_toi_noi_dung_chinh')}
      </a>
      <div className={styles.shell}>
        {sidebarOpen && <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
        <Sidebar
          open={sidebarOpen}
          collapsed={collapsed}
          user={user}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={toggleCollapse}
        />
        <div className={styles.content}>
          <TopBar
            menuOpen={sidebarOpen}
            onOpenMenu={() => setSidebarOpen(true)}
            user={user}
            onLogout={handleLogout}
            slot={<NotificationBell />}
          />
          <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
            <ErrorBoundary key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </>
  );
}
