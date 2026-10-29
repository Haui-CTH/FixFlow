// SPDX-License-Identifier: Apache-2.0
// Sidebar (S2.1–S2.3, S2.5, S2.8): nav theo role, active theo route con, thu gọn trên desktop, drawer trên mobile.

import { ChevronsLeft, ChevronsRight, Headphones, PlusCircle, X } from 'lucide-react';
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

  const canCreate = user?.role === 'customer' || user?.role === 'manager' || user?.role === 'admin';
  const isCreateActive = pathname === '/tickets/new';

  return (
    <aside className={cls} aria-label={t('sidebar.aside')}>
      <div className={styles.brand}>
        <img src="/logo.svg" alt="" width={32} height={32} />
        <div className={styles.brandTextWrap}><span className={styles.brandText}>FixFlow</span><span className={styles.campusTag}>HaUI Campus</span></div>
        <button className={styles.closeBtn} onClick={onClose} aria-label={t('sidebar.dong_menu')}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {canCreate && (
        <Link
          to="/tickets/new"
          title={collapsed ? t('nav.new_ticket') : undefined}
          aria-current={isCreateActive ? 'page' : undefined}
          className={`${styles.createBtn} ${isCreateActive ? styles.createBtnActive : ''}`}
        >
          <PlusCircle size={18} aria-hidden="true" />
          {!collapsed && <span>{t('nav.new_ticket')}</span>}
        </Link>
      )}

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

      {!collapsed ? (
        <div className={styles.supportCard}>
          <div className={styles.supportHead}>
            <Headphones size={14} aria-hidden="true" />
            <span>Hỗ trợ kỹ thuật HaUI</span>
          </div>
          <div className={styles.supportBody}>
            <div>Hotline: <strong>024.3765 5121</strong></div>
            <div>Văn phòng: <strong>P.204 Nhà A10</strong></div>
            <div className={styles.supportStatus}>
              <span className={styles.statusDot}></span>
              <span>Trực hiện trường 24/7</span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.supportCollapsed} title="Hỗ trợ HaUI ICT: 024.3765 5121">
          <Headphones size={18} aria-hidden="true" />
        </div>
      )}

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
