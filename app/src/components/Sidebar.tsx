// SPDX-License-Identifier: Apache-2.0
// Sidebar (S2.1–S2.3, S2.5, S2.8): nav theo role, active theo route con, thu gọn trên desktop, drawer trên mobile.

import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { isActive, navFor } from '../lib/nav';
import styles from './Layout.module.css';
import { t } from '../lib/i18n';

interface Props {
  open: boolean;
  collapsed: boolean;
  user: { username: string; role: string } | null;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ open, collapsed, user, onClose, onToggleCollapse }: Props) {
  const { pathname } = useLocation();
  const cls = [styles.sidebar, open && styles.sidebarOpen, collapsed && styles.collapsed].filter(Boolean).join(' ');

  return (
    <aside className={cls} aria-label={t('sidebar.aside')}>
      <div className={styles.brand}>
        <img src="/logo.svg" alt="" width={32} height={32} />
        <div className={styles.brandTextWrap}><span className={styles.brandText}>FixFlow</span><span className={styles.campusTag}>HaUI Campus</span></div>
        <button className={styles.closeBtn} onClick={onClose} aria-label={t('sidebar.dong_menu')}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <nav className={styles.nav} aria-label={t('sidebar.dieu_huong_chinh')}>
        {navFor(user?.role).map(({ path, label, icon: Icon }) => {
          const active = isActive(path, pathname);
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              aria-current={active ? 'page' : undefined}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
            >
              <Icon size={20} aria-hidden="true" />
              <span className={styles.navLabel}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <button
        className={styles.collapseBtn}
        onClick={onToggleCollapse}
        aria-label={collapsed ? t('sidebar.mo_rong_thanh_ben') : t('sidebar.thu_gon_thanh_ben')}
      >
        {collapsed ? <ChevronsRight size={18} aria-hidden="true" /> : <ChevronsLeft size={18} aria-hidden="true" />}
      </button>
    </aside>
  );
}
