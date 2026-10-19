// SPDX-License-Identifier: Apache-2.0
// StatusActions (P5.5, P5.6): nút chuyển trạng thái theo role; cập nhật lạc quan + rollback khi lỗi.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useMe } from '../../hooks/useMe';
import { ticketApi, userApi, type Ticket } from '../../lib/api';
import type { Role } from '../../lib/auth';
import { statusMeta } from '../../lib/ticket-meta';
import { actionsFor, type TicketAction } from '../../lib/ticket-transitions';
import { toastApi } from '../../lib/toast';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import styles from './TicketDetail.module.css';

export function StatusActions({
  ticket,
  role,
  onAssign,
}: {
  ticket: Ticket;
  role: Role | null;
  onAssign: () => void;
}) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: techs } = useQuery({ queryKey: ['technicians'], queryFn: userApi.technicians, enabled: role === 'technician', staleTime: 30_000 });
  const [pending, setPending] = useState<TicketAction | null>(null);

  const actions = actionsFor({
    role,
    status: ticket.status,
    isMine: !!me?.technician_id && ticket.technician_id === me.technician_id,
    isOwner: !!me?.user_id && ticket.customer_id === me.user_id,
  });

  const key = ['ticket', ticket.id];
  const run = useMutation({
    mutationFn: (a: TicketAction) => {
      if (a.takeSelf) {
        const name = techs?.find((t) => t.id === me?.technician_id)?.full_name ?? me?.username;
        return ticketApi.update(ticket.id, { status: 'assigned', technician_id: me!.technician_id!, technician_name: name });
      }
      return ticketApi.update(ticket.id, { status: a.to });
    },
    onMutate: async (a) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Ticket>(key);
      if (prev && a.to) qc.setQueryData<Ticket>(key, { ...prev, status: a.to });
      return { prev };
    },
    onError: (_e, _a, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toastApi.error('Không đổi được trạng thái. Có thể bạn không có quyền hoặc ticket đã thay đổi.');
    },
    onSuccess: (updated) => {
      qc.setQueryData(key, updated);
      toastApi.success(`Đã chuyển sang "${statusMeta(updated.status).label}"`);
    },
    onSettled: () => {
      setPending(null);
      qc.invalidateQueries({ queryKey: ['history', ticket.id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: key });
    },
  });

  if (actions.length === 0) return null;

  const click = (a: TicketAction) => {
    if (a.assign) return onAssign();
    if (a.takeSelf && !me?.technician_id) return toastApi.error('Tài khoản của bạn chưa có hồ sơ kỹ thuật viên.');
    if (a.confirm) return setPending(a);
    run.mutate(a);
  };

  return (
    <>
      <div className={styles.actions} role="group" aria-label="Hành động">
        {actions.map((a) => (
          <Button
            key={a.key}
            variant={a.primary ? 'primary' : 'secondary'}
            onClick={() => click(a)}
            disabled={run.isPending}
            loading={run.isPending && run.variables?.key === a.key}
          >
            {a.label}
          </Button>
        ))}
      </div>
      <ConfirmDialog
        open={!!pending}
        title={pending?.label ?? ''}
        message={pending?.confirm ?? ''}
        danger={pending?.to === 'cancelled'}
        loading={run.isPending}
        onConfirm={() => pending && run.mutate(pending)}
        onClose={() => setPending(null)}
      />
    </>
  );
}
