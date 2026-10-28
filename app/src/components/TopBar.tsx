// SPDX-License-Identifier: Apache-2.0
// TopBar (S2.4): hamburger (mobile), tiêu đề trang, slot cho NotificationBell (GĐ 07), nút theme.

import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { NAV_ITEMS, isActive } from '../lib/nav';
import { getTheme, setTheme, type Theme } from '../lib/theme';
import styles from './Layout.module.css';
import { t } from '../lib/i18n';

export function ThemeToggle() {
  const [theme, set] = useState<Theme>(getTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <Button
      variant="ghost"
      iconOnly
      aria-label={next === 'dark' ? t('top_bar.chuyen_sang_giao_dien_toi') : t('top_bar.chuyen_sang_giao_dien_sang')}
      onClick={() => {
        setTheme(next);
        set(next);
      }}
    >
      {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </Button>
  );
}

type User = { username: string; email?: string; role: string } | null;

// Menu người dùng: Esc / click ngoài đóng và trả focus về nút
// ponytail: đăng xuất chưa xác nhận khi có form dở (chưa có form nào cần), thêm ở GĐ 04.
export function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  if (!user) return null;
  return (
    <div className={styles.userMenu} ref={wrap}>
      <button
        ref={btn}
        className={styles.userBtn}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('top_bar.account', { name: user.username })}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {user.username.charAt(0)}
        </span>
        <span className={styles.userName}>{user.username}</span>
      </button>
      {open && (
        <div className={styles.menuPanel}>
          <div className={styles.menuUser}>
            <strong>{user.username}</strong>
            {user.email && <span className={styles.menuEmail}>{user.email}</span>}
            <Badge tone="info">{user.role}</Badge>
          </div>
          <button className={styles.logoutBtn} onClick={onLogout}>
            <LogOut size={16} aria-hidden="true" />
            {t('top_bar.dang_xuat')}
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar({
  menuOpen,
  onOpenMenu,
  slot,
  user,
  onLogout,
}: {
  menuOpen: boolean;
  onOpenMenu: () => void;
  slot?: ReactNode;
  user: User;
  onLogout: () => void;
}) {
  const { pathname } = useLocation();
  const title = NAV_ITEMS.find((i) => isActive(i.path, pathname))?.label ?? '';
  return (
    <header className={styles.topBar}>
      <Button
        variant="ghost"
        iconOnly
        className={styles.hamburger}
        onClick={onOpenMenu}
        aria-label={t('top_bar.mo_menu')}
        aria-expanded={menuOpen}
      >
        <Menu size={20} aria-hidden="true" />
      </Button>
      <span className={styles.mobileBrand}>FixFlow</span>
      <span className={styles.pageName}>{title}</span>
      <div className={styles.topActions}>
        {slot}
        <LanguageSwitcher />
        <ThemeToggle />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
