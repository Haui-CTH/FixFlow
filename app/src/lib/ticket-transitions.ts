// SPDX-License-Identifier: Apache-2.0
// Ma trận hành động theo role × status (P5.5). Khớp STATUS_TRANSITIONS + role guard ở BE (routes/tickets.py).

import type { Role } from './auth';

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

const CANCEL: TicketAction = {
  key: 'cancel',
  label: 'Huỷ ticket',
  to: 'cancelled',
  confirm: 'Huỷ ticket này? Không thể hoàn tác.',
};

const STAFF = (status: string): TicketAction[] => {
  switch (status) {
    case 'new':
      return [{ key: 'assign', label: 'Phân công', assign: true, primary: true }, CANCEL];
    case 'assigned':
      return [
        { key: 'start', label: 'Bắt đầu xử lý', to: 'in_progress', primary: true },
        { key: 'reassign', label: 'Phân công lại', assign: true },
        CANCEL,
      ];
    case 'in_progress':
      return [
        { key: 'resolve', label: 'Đã giải quyết', to: 'resolved', primary: true },
        { key: 'pause', label: 'Tạm dừng', to: 'pending' },
      ];
    case 'pending':
      return [
        { key: 'resume', label: 'Tiếp tục xử lý', to: 'in_progress', primary: true },
        { key: 'resolve', label: 'Đã giải quyết', to: 'resolved' },
        CANCEL,
      ];
    case 'resolved':
      return [
        {
          key: 'close',
          label: 'Đóng ticket',
          to: 'closed',
          primary: true,
          confirm: 'Đóng ticket? Sau khi đóng sẽ không thể mở lại.',
        },
        { key: 'reopen', label: 'Mở lại', to: 'in_progress' },
      ];
    default:
      return []; // closed / cancelled: trạng thái cuối
  }
};

export function actionsFor({ role, status, isMine = false, isOwner = false }: Ctx): TicketAction[] {
  if (role === 'manager' || role === 'admin') return STAFF(status);
  if (role === 'technician') {
    if (status === 'new') return [{ key: 'take', label: 'Nhận ticket', takeSelf: true, primary: true }];
    if (!isMine) return [];
    // KTV không huỷ / đóng / phân công lại / mở lại
    return STAFF(status).filter((a) => !a.assign && a.to !== 'cancelled' && a.to !== 'closed' && a.key !== 'reopen');
  }
  if (role === 'customer' && isOwner && status === 'resolved') {
    return [
      {
        key: 'close',
        label: 'Xác nhận & đóng ticket',
        to: 'closed',
        primary: true,
        confirm: 'Xác nhận sự cố đã được xử lý và đóng ticket?',
      },
      { key: 'reopen', label: 'Chưa xong, mở lại', to: 'in_progress' },
    ];
  }
  return [];
}
