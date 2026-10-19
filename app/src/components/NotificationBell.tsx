// SPDX-License-Identifier: Apache-2.0
// NotificationBell (N7.2, N7.3): chuông trên TopBar + dropdown 10 thông báo gần nhất.
// Esc / click ngoài đóng và trả focus; mobile hiện dạng sheet toàn chiều ngang (CSS).

import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationActions, useNotificationBell } from '../hooks/useNotifications';
import { NotificationItem } from './Notifications/NotificationItem';
import { Button } from './ui/Button';
import { SkeletonRows } from './ui/Skeleton';
import styles from './NotificationBell.module.css';
import { t } from '../lib/i18n';

export function NotificationBell() {
  const { items, unread, isLoading, isError, refetch } = useNotificationBell();
  const { markRead, markAll } = useNotificationActions();
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

  const shown = unread > 99 ? '99+' : String(unread);
  return (
    <div className={styles.wrap} ref={wrap}>
      <button
        ref={btn}
        className={styles.bell}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('notification_bell.aria', { count: unread })}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && <span className={styles.badge}>{shown}</span>}
      </button>
      {/* thông báo thay đổi số lượng cho screen reader, không cướp focus */}
      <span className="sr-only" aria-live="polite">
        {unread > 0 ? t('notification_bell.sr_unread', { count: unread }) : t('notification_bell.khong_co_thong_bao_chua_doc')}
      </span>

      {open && (
        <div className={styles.panel} role="dialog" aria-label={t('notification_bell.thong_bao')}>
          <div className={styles.head}>
            <strong>{t('notification_bell.thong_bao')}</strong>
            <Button variant="ghost" size="sm" disabled={unread === 0 || markAll.isPending} onClick={() => markAll.mutate()}>
              {t('notification_bell.danh_dau_tat_ca_da_doc')}
            </Button>
          </div>
          <div className={styles.list}>
            {isLoading ? (
              <SkeletonRows rows={3} />
            ) : isError ? (
              <p className={styles.note} role="alert">
                {t('notification_bell.load_error')}{' '}
                <button className={styles.link} onClick={() => refetch()}>
                  {t('notification_bell.thu_lai')}
                </button>
              </p>
            ) : items.length === 0 ? (
              <p className={styles.note}>{t('notification_bell.ban_da_xem_het_thong_bao')}</p>
            ) : (
              items.map((n) => (
                <NotificationItem key={n.id} notification={n} onMarkRead={(id) => markRead.mutate(id)} onNavigate={() => setOpen(false)} />
              ))
            )}
          </div>
          <Link to="/notifications" className={styles.all} onClick={() => setOpen(false)}>
            {t('notification_bell.xem_tat_ca')}
          </Link>
        </div>
      )}
    </div>
  );
}
