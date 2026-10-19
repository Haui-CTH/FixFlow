// SPDX-License-Identifier: Apache-2.0
// Ma trận hành động theo role × status (P5.5). Khớp STATUS_TRANSITIONS + role guard ở BE (routes/tickets.py).
// Nhãn được dịch tại thời điểm gọi (không giữ hằng số) để đổi ngôn ngữ có hiệu lực ngay.

import type { Role } from './auth';
import { t } from './i18n';

export interface TicketAction {
  key: string;
  label: string;
  to?: string; // status đích; bỏ trống = mở modal phân công
  assign?: boolean; // cần chọn KTV (modal)
  takeSelf?: boolean; // technician tự nhận
  primary?: boolean;
  confirm?: string; // có thì hỏi xác nhận
}

interface Ctx {
  role: Role | null;
  status: string;
  isMine?: boolean; // technician: ticket được giao cho mình
  isOwner?: boolean; // customer: ticket do mình tạo
}

const cancel = (): TicketAction => ({
  key: 'cancel',
  label: t('action.cancel'),
  to: 'cancelled',
  confirm: t('action.cancel_confirm'),
});

const STAFF = (status: string): TicketAction[] => {
  switch (status) {
    case 'new':
      return [{ key: 'assign', label: t('action.assign'), assign: true, primary: true }, cancel()];
    case 'assigned':
      return [
        { key: 'start', label: t('action.start'), to: 'in_progress', primary: true },
        { key: 'reassign', label: t('action.reassign'), assign: true },
        cancel(),
      ];
    case 'in_progress':
      return [
        { key: 'resolve', label: t('action.resolve'), to: 'resolved', primary: true },
        { key: 'pause', label: t('action.pause'), to: 'pending' },
      ];
    case 'pending':
      return [
        { key: 'resume', label: t('action.resume'), to: 'in_progress', primary: true },
        { key: 'resolve', label: t('action.resolve'), to: 'resolved' },
        cancel(),
      ];
    case 'resolved':
      return [
        { key: 'close', label: t('action.close'), to: 'closed', primary: true, confirm: t('action.close_confirm') },
        { key: 'reopen', label: t('action.reopen'), to: 'in_progress' },
      ];
    default:
      return []; // closed / cancelled: trạng thái cuối
  }
};

export function actionsFor({ role, status, isMine = false, isOwner = false }: Ctx): TicketAction[] {
  if (role === 'manager' || role === 'admin') return STAFF(status);
  if (role === 'technician') {
    if (status === 'new') return [{ key: 'take', label: t('action.take'), takeSelf: true, primary: true }];
    if (!isMine) return [];
    // KTV không huỷ / đóng / phân công lại / mở lại
    return STAFF(status).filter((a) => !a.assign && a.to !== 'cancelled' && a.to !== 'closed' && a.key !== 'reopen');
  }
  if (role === 'customer' && isOwner && status === 'resolved') {
    return [
      { key: 'close', label: t('action.customer_close'), to: 'closed', primary: true, confirm: t('action.customer_close_confirm') },
      { key: 'reopen', label: t('action.customer_reopen'), to: 'in_progress' },
    ];
  }
  return [];
}
