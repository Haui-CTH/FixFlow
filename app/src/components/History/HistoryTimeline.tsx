// SPDX-License-Identifier: Apache-2.0
// DX-FSM HistoryTimeline – audit log timeline (F5.4)
// Hiển thị events theo thứ tự thời gian, có icon + color per action.

import { useQuery } from '@tanstack/react-query';
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

interface HistoryTimelineProps {
  ticketId: string;
}

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
    <section className={styles.panel} aria-label="Ticket history">
      <header className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon} aria-hidden="true">🕐</span>
          Lịch sử
          <span className={styles.count}>({events.length})</span>
        </h2>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
          <div>Đang tải lịch sử…</div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className={styles.errorBox} role="alert">
          <span>Lỗi tải lịch sử: {(error as Error)?.message || 'Unknown'}</span>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && events.length === 0 && (
        <div className={styles.empty}>
          Chưa có sự kiện nào trên ticket này.
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
  const description = describeEvent(event);
  const showValues = event.old_value || event.new_value;

  return (
    <li className={styles.event}>
      <div
        className={styles.iconWrap}
        style={{ background: color }}
        aria-hidden="true"
      >
        {icon}
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
