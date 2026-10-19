// SPDX-License-Identifier: Apache-2.0
// DX-FSM ticket metadata (D1.5) — nguồn duy nhất cho nhãn/tone/icon của status, priority, category.

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

export type Tone = 'info' | 'assigned' | 'warning' | 'muted' | 'success' | 'dark' | 'danger';
export interface Meta {
  label: string;
  tone: Tone;
  icon?: LucideIcon;
}

export const STATUS_META: Record<string, Meta> = {
  new: { label: 'Mới', tone: 'info', icon: CircleDot },
  assigned: { label: 'Đã giao', tone: 'assigned', icon: UserCheck },
  in_progress: { label: 'Đang xử lý', tone: 'warning', icon: Loader },
  pending: { label: 'Chờ', tone: 'muted', icon: PauseCircle },
  resolved: { label: 'Đã giải quyết', tone: 'success', icon: CheckCircle2 },
  closed: { label: 'Đã đóng', tone: 'dark', icon: Archive },
  cancelled: { label: 'Đã huỷ', tone: 'danger', icon: XCircle },
  sla_breached: { label: 'Quá SLA', tone: 'danger', icon: AlarmClock },
};

// BE/DB dùng 'critical' (enum ticket_priority); 'urgent' chỉ là bí danh (metrics/Dashboard cũ).
const URGENT: Meta = { label: 'Khẩn cấp', tone: 'danger', icon: Flame };
export const PRIORITY_META: Record<string, Meta> = {
  low: { label: 'Thấp', tone: 'success', icon: ArrowDown },
  medium: { label: 'Trung bình', tone: 'info', icon: Minus },
  high: { label: 'Cao', tone: 'warning', icon: ArrowUp },
  critical: URGENT,
  urgent: URGENT,
};

export const CATEGORY_META: Record<string, Meta> = {
  hardware: { label: 'Phần cứng', tone: 'muted' },
  software: { label: 'Phần mềm', tone: 'info' },
  network: { label: 'Mạng', tone: 'assigned' },
  electrical: { label: 'Điện', tone: 'warning' },
  plumbing: { label: 'Cấp thoát nước', tone: 'info' },
  hvac: { label: 'Điều hoà', tone: 'warning' },
  other: { label: 'Khác', tone: 'muted' },
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
export const CATEGORY_VALUES = ['hardware', 'software', 'network', 'electrical', 'other'];
// Ticket đã kết thúc: không còn đếm SLA
export const FINAL_STATUSES = ['resolved', 'closed', 'cancelled'];
