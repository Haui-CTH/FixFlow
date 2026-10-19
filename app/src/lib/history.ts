// SPDX-License-Identifier: Apache-2.0
// DX-FSM History API client (F5.4)
// BE Sprint 4: GET /tickets/{id}/history (audit log).

import { api } from './api';
import { locale, t } from './i18n';

// ─── Types (mirror BE HistoryResponse) ────────────────────

export interface HistoryActor {
  id: string;
  username: string | null;
  full_name: string | null;
}

/**
 * Action types. BE uses these strings (xem BE history.py cho canonical list).
 * - created: ticket mới
 * - status_changed: status transition
 * - assigned: technician được gán
 * - unassigned: bỏ gán
 * - priority_changed
 * - category_changed
 * - sla_breached
 * - sla_met
 * - note_added (internal note)
 * - comment_added (customer-visible)
 * - updated: generic field change
 * - resolved / closed
 */
export type HistoryAction =
  | 'created'
  | 'status_changed'
  | 'assigned'
  | 'unassigned'
  | 'priority_changed'
  | 'category_changed'
  | 'sla_breached'
  | 'sla_met'
  | 'note_added'
  | 'comment_added'
  | 'updated'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | string; // fallback for unknown actions

export interface HistoryEvent {
  id: string;
  action: HistoryAction;
  actor: HistoryActor | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─── API ──────────────────────────────────────────────────

export const historyApi = {
  list: async (ticketId: string): Promise<HistoryEvent[]> => {
    const r = await api.get<HistoryEvent[]>(`/tickets/${ticketId}/history`);
    return r.data;
  },
};

// ─── Helpers (exported for testing) ───────────────────────

const ACTION_COLOR: Record<string, string> = {
  created: 'var(--info)',          // blue
  status_changed: 'var(--status-assigned)',  // purple
  assigned: 'var(--status-assigned)',        // indigo
  unassigned: 'var(--text-muted)',      // gray
  priority_changed: 'var(--warning)', // yellow
  category_changed: 'var(--info)', // cyan
  sla_breached: 'var(--danger)',    // red
  sla_met: 'var(--success)',         // green
  note_added: 'var(--status-assigned)',      // purple
  comment_added: 'var(--info)',   // blue
  updated: 'var(--text-muted)',         // gray
  resolved: 'var(--success)',        // green
  closed: 'var(--primary)',          // dark gray
  reopened: 'var(--warning)',        // orange
};

const ACTION_ICON: Record<string, string> = {
  created: '+',
  status_changed: '↻',
  assigned: '→',
  unassigned: '←',
  priority_changed: '↑',
  category_changed: '⊕',
  sla_breached: '!',
  sla_met: '✓',
  note_added: '✎',
  comment_added: '💬',
  updated: '•',
  resolved: '✓',
  closed: '×',
  reopened: '↺',
};

/**
 * Màu (CSS token) cho action type. Fallback = gray.
 */
export function getActionColor(action: string): string {
  return ACTION_COLOR[action] || 'var(--text-muted)';
}

/**
 * Icon char cho action type. Fallback = '•'.
 */
export function getActionIcon(action: string): string {
  return ACTION_ICON[action] || '•';
}

/**
 * Build human-readable description từ event.
 * Format: "Alice changed status from new to in_progress"
 *         "Bob added internal note"
 *         "SLA breached (5m overdue)"
 */
export function describeEvent(event: HistoryEvent): string {
  const actor = event.actor?.full_name || event.actor?.username || t('history.system');
  const action = event.action;
  const oldV = event.old_value;
  const newV = event.new_value;
  const change = { actor, from: oldV || '?', to: newV || '?' };

  switch (action) {
    case 'created':
      return t('history.created', { actor });
    case 'status_changed':
      return t('history.status_changed', change);
    case 'assigned':
      return t('history.assigned', { actor, to: newV || 'KTV' });
    case 'unassigned':
      return t('history.unassigned', { actor });
    case 'priority_changed':
      return t('history.priority_changed', change);
    case 'category_changed':
      return t('history.category_changed', change);
    case 'sla_breached': {
      const minutes = (event.metadata?.overdue_minutes as number) || 0;
      return t('history.sla_breached', { minutes });
    }
    case 'sla_met':
      return t('history.sla_met', { actor });
    case 'note_added':
      return t('history.note_added', { actor });
    case 'comment_added':
      return t('history.comment_added', { actor });
    case 'resolved':
      return t('history.resolved', { actor });
    case 'closed':
      return t('history.closed', { actor });
    case 'reopened':
      return t('history.reopened', { actor });
    case 'updated':
      return t('history.updated', { actor });
    default:
      return `${actor} ${action}${oldV ? `: ${oldV} → ${newV}` : ''}`;
  }
}

/**
 * Format relative time theo ngôn ngữ hiện hành. Same style as notes/notifications.
 */
export function formatHistoryTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return t('time.just_now');
  if (diffSec < 3600) return t('time.m_ago', { n: Math.floor(diffSec / 60) });
  if (diffSec < 86400) return t('time.h_ago', { n: Math.floor(diffSec / 3600) });
  if (diffSec < 7 * 86400) return t('time.d_ago', { n: Math.floor(diffSec / 86400) });
  return new Date(iso).toLocaleDateString(locale());
}

/**
 * Format full timestamp (used in tooltip / details).
 */
export function formatHistoryFullTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(locale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
