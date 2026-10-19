// SPDX-License-Identifier: Apache-2.0
// DX-FSM App Layout (F5.5: responsive with mobile drawer)

import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { logout } from '../lib/auth';
import { useAuthStore } from '../lib/store';
import styles from './Layout.module.css';

export default function Layout() {
  const location = useLocation();
  const { user, logout: doLogout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    doLogout();
    logout();
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Close sidebar on route change (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/tickets', label: 'Tickets' },
    { path: '/notifications', label: 'Notifications' },
  ];

  return (
    <>
      {/* Mobile top bar (only shown <768px) */}
      <div className={styles.mobileBar}>
        <span className={styles.mobileBrand}>DX-FSM</span>
        <button
          className={styles.hamburger}
          onClick={() => setSidebarOpen(true)}
          aria-label="Mở menu"
          aria-expanded={sidebarOpen}
        >
          <span className={styles.hamburgerIcon} aria-hidden="true">
            <span />
          </span>
          Menu
        </button>
      </div>

      <div className={styles.shell}>
        {/* Backdrop (mobile) */}
        {sidebarOpen && (
          <div
            className={styles.backdrop}
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
          aria-label="Sidebar navigation"
        >
          <div className={styles.brand}>
            DX-FSM
            <button
              className={styles.closeBtn}
              onClick={closeSidebar}
              aria-label="Đóng menu"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${
                  location.pathname === item.path ? styles.navLinkActive : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.userBlock}>
            <div className={styles.username}>{user?.username}</div>
            <div className={styles.role}>{user?.role}</div>
            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
