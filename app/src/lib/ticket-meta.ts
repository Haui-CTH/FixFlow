// SPDX-License-Identifier: Apache-2.0
// DX-FSM ticket metadata (D1.5) — nguồn duy nhất cho nhãn/tone/icon của status, priority, category.
// `label` là getter: dịch theo ngôn ngữ hiện tại mỗi lần đọc (đổi ngôn ngữ không cần tạo lại map).

import {
  AlarmClock,
  Archive,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleDot,
  Flame,
  Loader,
  Minus,
  PauseCircle,
  UserCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { t } from './i18n';

export type Tone = 'info' | 'assigned' | 'warning' | 'muted' | 'success' | 'dark' | 'danger';
export interface Meta {
  label: string;
  tone: Tone;
  icon?: LucideIcon;
}

const meta = (key: string, tone: Tone, icon?: LucideIcon): Meta => ({
  get label() {
    return t(key);
  },
  tone,
  icon,
});

export const STATUS_META: Record<string, Meta> = {
  new: meta('status.new', 'info', CircleDot),
  assigned: meta('status.assigned', 'assigned', UserCheck),
  in_progress: meta('status.in_progress', 'warning', Loader),
  pending: meta('status.pending', 'muted', PauseCircle),
  resolved: meta('status.resolved', 'success', CheckCircle2),
  closed: meta('status.closed', 'dark', Archive),
  cancelled: meta('status.cancelled', 'danger', XCircle),
  sla_breached: meta('status.sla_breached', 'danger', AlarmClock),
};

// BE/DB dùng 'critical' (enum ticket_priority); 'urgent' chỉ là bí danh (metrics/Dashboard cũ).
const URGENT = meta('priority.critical', 'danger', Flame);
export const PRIORITY_META: Record<string, Meta> = {
  low: meta('priority.low', 'success', ArrowDown),
  medium: meta('priority.medium', 'info', Minus),
  high: meta('priority.high', 'warning', ArrowUp),
  critical: URGENT,
  urgent: URGENT,
};

export const CATEGORY_META: Record<string, Meta> = {
  hardware: meta('category.hardware', 'muted'),
  software: meta('category.software', 'info'),
  network: meta('category.network', 'assigned'),
  electrical: meta('category.electrical', 'warning'),
  access_control: meta('category.access_control', 'info'),
  service_request: meta('category.service_request', 'assigned'),
  plumbing: meta('category.plumbing', 'info'),
  hvac: meta('category.hvac', 'warning'),
  other: meta('category.other', 'muted'),
};

const lookup =
  (map: Record<string, Meta>) =>
  (key: string | null | undefined): Meta =>
    (key && map[key]) || { label: key || '-', tone: 'muted' };

export const statusMeta = lookup(STATUS_META);
export const priorityMeta = lookup(PRIORITY_META);
export const categoryMeta = lookup(CATEGORY_META);

// Giá trị BE chấp nhận (enum DB) — dùng cho bộ lọc/form
export const STATUS_VALUES = ['new', 'assigned', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled'];
export const PRIORITY_VALUES = ['low', 'medium', 'high', 'critical'];
export const CATEGORY_VALUES = ['hardware', 'software', 'network', 'electrical', 'access_control', 'service_request', 'other'];
// Ticket đã kết thúc: không còn đếm SLA
export const FINAL_STATUSES = ['resolved', 'closed', 'cancelled'];
