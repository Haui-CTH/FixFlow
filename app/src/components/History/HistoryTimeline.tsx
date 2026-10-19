// SPDX-License-Identifier: Apache-2.0
// DX-FSM HistoryTimeline – audit log timeline (F5.4)
// Hiển thị events theo thứ tự thời gian, có icon + color per action.

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUp, Clock, MessageSquare, Paperclip, Plus, StickyNote, UserPlus, type LucideIcon } from 'lucide-react';
import {
  historyApi,
  getActionColor,
  getActionIcon,
  describeEvent,
  formatHistoryTime,
  formatHistoryFullTime,
  type HistoryEvent,
} from '../../lib/history';
import styles from './HistoryTimeline.module.css';
import { t } from '../../lib/i18n';

interface HistoryTimelineProps {
  ticketId: string;
}

const ICONS: Record<string, LucideIcon> = {
  created: Plus,
  status_changed: ArrowRight,
  assigned: UserPlus,
  priority_changed: ArrowUp,
  comment_added: MessageSquare,
  note_added: StickyNote,
  attachment_added: Paperclip,
};

export function HistoryTimeline({ ticketId }: HistoryTimelineProps) {
  const { data: events = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['history', ticketId],
    queryFn: () => historyApi.list(ticketId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // Newest first
  const sortedEvents = [...events].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );

  return (
    <section className={styles.panel} aria-label={t('history_timeline.lich_su_ticket')}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          <Clock size={20} aria-hidden="true" />
          {t('history_timeline.lich_su')}
          <span className={styles.count}>({events.length})</span>
        </h2>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
          <div>{t('history_timeline.dang_tai_lich_su')}</div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className={styles.errorBox} role="alert">
          <span>{t('history_timeline.load_error', { error: (error as Error)?.message || t('history_timeline.khong_ro') })}</span>
          <button onClick={() => refetch()}>{t('history_timeline.thu_lai')}</button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && events.length === 0 && (
        <div className={styles.empty}>
          {t('history_timeline.chua_co_su_kien_nao_tren_ticket_na')}
        </div>
      )}

      {/* Timeline */}
      {!isLoading && !isError && events.length > 0 && (
        <ol className={styles.timeline}>
          {sortedEvents.map((event) => (
            <HistoryItem key={event.id} event={event} />
          ))}
        </ol>
      )}
    </section>
  );
}

function HistoryItem({ event }: { event: HistoryEvent }) {
  const color = getActionColor(event.action);
  const icon = getActionIcon(event.action);
  const Icon = ICONS[event.action];
  const description = describeEvent(event);
  const showValues = event.old_value || event.new_value;

  return (
    <li className={styles.event}>
      <div
        className={styles.iconWrap}
        style={{ background: color }}
        aria-hidden="true"
      >
        {Icon ? <Icon size={16} /> : icon}
      </div>
      <div className={styles.eventBody}>
        <p className={styles.eventText}>{description}</p>

        {showValues && (event.action === 'status_changed' || event.action === 'priority_changed' || event.action === 'category_changed') && (
          <p className={styles.eventText}>
            {event.old_value && (
              <>
                <span className={styles.eventValue}>{event.old_value}</span>
                <span className={styles.eventArrow}> → </span>
              </>
            )}
            {event.new_value && (
              <span className={styles.eventValue}>{event.new_value}</span>
            )}
          </p>
        )}

        <div className={styles.eventMeta}>
          <span className={styles.eventAction}>{event.action}</span>
          <span>·</span>
          <time
            className={styles.eventTime}
            dateTime={event.created_at}
            title={formatHistoryFullTime(event.created_at)}
          >
            {formatHistoryTime(event.created_at)}
          </time>
        </div>
      </div>
    </li>
  );
}
