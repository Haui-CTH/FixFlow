// SPDX-License-Identifier: Apache-2.0
// SLA còn lại / quá hạn (T3.6). Hàm thuần để dễ test.

import { FINAL_STATUSES } from './ticket-meta';
import { t } from './i18n';

export type SlaLevel = 'ok' | 'warning' | 'overdue';
export interface SlaInfo {
  level: SlaLevel;
  text: string; // "còn 3 giờ" | "quá 2 giờ"
}

function span(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 60) return t('sla.minutes', { count: Math.max(min, 1) });
  const h = Math.floor(min / 60);
  if (h < 48) return t('sla.hours', { count: h });
  return t('sla.days', { count: Math.floor(h / 24) });
}

// null: không hiển thị (đã kết thúc hoặc không có hạn SLA)
export function slaInfo(
  deadline: string | null | undefined,
  status: string,
  createdAt: string | null | undefined,
  now: number,
): SlaInfo | null {
  if (!deadline || FINAL_STATUSES.includes(status)) return null;
  const end = Date.parse(deadline);
  if (Number.isNaN(end)) return null;
  const left = end - now;
  if (left < 0) return { level: 'overdue', text: t('sla.overdue', { span: span(-left) }) };
  const start = createdAt ? Date.parse(createdAt) : NaN;
  const total = end - start;
  const warning = total > 0 && left / total < 0.25;
  return { level: warning ? 'warning' : 'ok', text: t('sla.left', { span: span(left) }) };
}
