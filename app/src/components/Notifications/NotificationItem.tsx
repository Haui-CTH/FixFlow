// SPDX-License-Identifier: Apache-2.0
// DX-FSM NotificationItem – một thông báo (N7.4, N7.5)
// Bấm: đánh dấu đã đọc + chuyển tới ticket liên quan. Chưa đọc = chấm + chữ "Mới" (không chỉ màu).

import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRelative } from '../../lib/format';
import type { Notification, NotificationType } from '../../lib/notifications';
import styles from '../../pages/Notifications.module.css';
import { t } from '../../lib/i18n';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onNavigate?: () => void; // ví dụ: đóng dropdown của chuông
}

const ICON: Record<NotificationType, { Icon: LucideIcon; label: string; cls: string }> = {
  info: { Icon: Info, label: t('notification_item.thong_tin'), cls: styles.typeInfo },
  success: { Icon: CheckCircle2, label: t('notification_item.thanh_cong'), cls: styles.typeSuccess },
  warning: { Icon: AlertTriangle, label: t('notification_item.canh_bao'), cls: styles.typeWarning },
  error: { Icon: XCircle, label: t('notification_item.loi'), cls: styles.typeError },
};

export function NotificationItem({ notification, onMarkRead, onNavigate }: NotificationItemProps) {
  const navigate = useNavigate();
  const isUnread = !notification.is_read;
  const { Icon, label, cls } = ICON[notification.type] ?? ICON.info;

  const open = () => {
    if (isUnread) onMarkRead(notification.id);
    if (notification.ticket_id) navigate(`/tickets/${notification.ticket_id}`);
    onNavigate?.();
  };

  return (
    <button
      type="button"
      className={`${styles.item} ${isUnread ? styles.itemUnread : ''}`}
      onClick={open}
      aria-label={isUnread ? t('notification_item.unread_aria', { title: notification.title }) : notification.title}
    >
      <span className={`${styles.icon} ${cls}`} title={label}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className={styles.content}>
        <span className={styles.contentHeader}>
          <span className={styles.contentTitle}>{notification.title}</span>
          {isUnread && <span className={styles.newBadge}>{t('notification_item.moi')}</span>}
        </span>
        <span className={styles.contentMessage}>{notification.message}</span>
        <span className={styles.contentFoot}>
          {notification.ticket_id && (
            <span className={styles.ticketRef}>{notification.ticket_number || notification.ticket_id.slice(0, 8)}</span>
          )}
          <time className={styles.contentTime} dateTime={notification.created_at}>
            {formatRelative(notification.created_at)}
          </time>
        </span>
      </span>
    </button>
  );
}
