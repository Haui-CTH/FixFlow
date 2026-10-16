// SPDX-License-Identifier: Apache-2.0
// DX-FSM NotificationItem – single notification row
// F5.2: Click to mark read + navigate to ticket if available.

import { useNavigate } from 'react-router-dom';
import {
  type Notification,
  formatRelativeTime,
  getTypeIcon,
  getTypeColor,
} from '../../lib/notifications';
import styles from '../../pages/Notifications.module.css';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const navigate = useNavigate();
  const isUnread = !notification.is_read;

  const handleClick = () => {
    if (isUnread) {
      onMarkRead(notification.id);
    }
    if (notification.ticket_id) {
      navigate(`/tickets/${notification.ticket_id}`);
    }
  };

  const handleTicketRefClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.ticket_id) {
      if (isUnread) {
        onMarkRead(notification.id);
      }
      navigate(`/tickets/${notification.ticket_id}`);
    }
  };

  const iconBg = getTypeColor(notification.type);

  return (
    <button
      type="button"
      className={`${styles.item} ${isUnread ? styles.itemUnread : ''}`}
      onClick={handleClick}
      aria-label={isUnread ? `Unread: ${notification.title}` : notification.title}
    >
      {/* Unread dot */}
      <div
        className={`${styles.unreadDot} ${isUnread ? '' : styles.unreadDotRead}`}
        aria-hidden="true"
      />

      {/* Type icon */}
      <div
        className={styles.icon}
        style={{ background: iconBg }}
        aria-hidden="true"
      >
        {getTypeIcon(notification.type)}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h3 className={styles.contentTitle}>{notification.title}</h3>
          <time className={styles.contentTime} dateTime={notification.created_at}>
            {formatRelativeTime(notification.created_at)}
          </time>
        </div>
        <p className={styles.contentMessage}>{notification.message}</p>
        {notification.ticket_id && (
          <span
            className={styles.ticketRef}
            onClick={handleTicketRefClick}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleTicketRefClick(e as unknown as React.MouseEvent);
              }
            }}
          >
            {notification.ticket_number || notification.ticket_id.slice(0, 8)}
          </span>
        )}
      </div>
    </button>
  );
}
