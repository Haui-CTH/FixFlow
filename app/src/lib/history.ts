// SPDX-License-Identifier: Apache-2.0
// DX-FSM History API client (F5.4)
// BE Sprint 4: GET /tickets/{id}/history (audit log).

import { api } from './api';

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
  created: '#3b82f6',          // blue
  status_changed: '#8b5cf6',  // purple
  assigned: '#6366f1',        // indigo
  unassigned: '#9ca3af',      // gray
  priority_changed: '#f59e0b', // yellow
  category_changed: '#06b6d4', // cyan
  sla_breached: '#ef4444',    // red
  sla_met: '#10b981',         // green
  note_added: '#8b5cf6',      // purple
  comment_added: '#3b82f6',   // blue
  updated: '#6b7280',         // gray
  resolved: '#10b981',        // green
  closed: '#374151',          // dark gray
  reopened: '#f97316',        // orange
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
 * Color (hex) cho action type. Fallback = gray.
 */
export function getActionColor(action: string): string {
  return ACTION_COLOR[action] || '#6b7280';
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
  const actorName = event.actor?.full_name || event.actor?.username || 'Hệ thống';
  const action = event.action;
  const oldV = event.old_value;
  const newV = event.new_value;

  switch (action) {
    case 'created':
      return `${actorName} tạo ticket`;
    case 'status_changed':
      return `${actorName} đổi trạng thái: ${oldV || '?'} → ${newV || '?'}`;
    case 'assigned':
      return `${actorName} gán cho ${newV || 'KTV'}`;
    case 'unassigned':
      return `${actorName} bỏ gán`;
    case 'priority_changed':
      return `${actorName} đổi ưu tiên: ${oldV || '?'} → ${newV || '?'}`;
    case 'category_changed':
      return `${actorName} đổi danh mục: ${oldV || '?'} → ${newV || '?'}`;
    case 'sla_breached': {
      const minutes = (event.metadata?.overdue_minutes as number) || 0;
      return `SLA breach — quá deadline ${minutes}m`;
    }
    case 'sla_met':
      return `${actorName} hoàn thành trong SLA`;
    case 'note_added':
      return `${actorName} thêm note nội bộ`;
    case 'comment_added':
      return `${actorName} thêm bình luận`;
    case 'resolved':
      return `${actorName} đánh dấu resolved`;
    case 'closed':
      return `${actorName} đóng ticket`;
    case 'reopened':
      return `${actorName} mở lại ticket`;
    case 'updated':
      return `${actorName} cập nhật ticket`;
    default:
      return `${actorName} ${action}${oldV ? `: ${oldV} → ${newV}` : ''}`;
  }
}

/**
 * Format relative time in Vietnamese. Same style as notes/notifications.
 */
export function formatHistoryTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'vừa xong';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h trước`;
  if (diffSec < 7 * 86400) return `${Math.floor(diffSec / 86400)}d trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

/**
 * Format full timestamp (used in tooltip / details).
 */
export function formatHistoryFullTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
