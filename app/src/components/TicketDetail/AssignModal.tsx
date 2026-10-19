// SPDX-License-Identifier: Apache-2.0
// AssignModal (P5.11): chọn KTV theo tải/chuyên môn, có gợi ý "Đề xuất".
// ponytail: gợi ý chấm điểm phía client (chuyên môn + tải); ai-service /recommend chưa có dữ liệu KTV nên chưa gọi.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ticketApi, userApi, type Technician, type Ticket } from '../../lib/api';
import { categoryMeta } from '../../lib/ticket-meta';
import { toastApi } from '../../lib/toast';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ErrorState } from '../ui/States';
import { SkeletonRows } from '../ui/Skeleton';
import styles from './TicketDetail.module.css';

// KTV đề xuất: khớp chuyên môn > còn rảnh > tải thấp nhất. null nếu không ai nhận được.
export function recommendTechnician(techs: Technician[], category: string): string | null {
  const usable = techs.filter((t) => t.is_available && t.current_load < t.max_concurrent_tickets);
  if (usable.length === 0) return null;
  const score = (t: Technician) =>
    (t.specialty.includes(category) ? 10 : 0) - t.current_load / Math.max(t.max_concurrent_tickets, 1);
  return [...usable].sort((a, b) => score(b) - score(a))[0].id;
}

export function AssignModal({
  ticket,
  open,
  onClose,
}: {
  ticket: Ticket;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: techs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['technicians'],
    queryFn: userApi.technicians,
    enabled: open,
    staleTime: 30_000,
  });
  const recommended = recommendTechnician(techs, ticket.category);
  const [picked, setPicked] = useState<string>('');

  // Mở modal: chọn sẵn KTV hiện tại hoặc KTV đề xuất
  useEffect(() => {
    if (open) setPicked(ticket.technician_id || recommended || '');
  }, [open, ticket.technician_id, recommended]);

  const assign = useMutation({
    mutationFn: () => {
      const t = techs.find((x) => x.id === picked)!;
      return ticketApi.update(ticket.id, {
        ...(ticket.status === 'new' ? { status: 'assigned' } : {}),
        technician_id: t.id,
        technician_name: t.full_name,
      });
    },
    onSuccess: (updated) => {
      qc.setQueryData(['ticket', ticket.id], updated);
      qc.invalidateQueries({ queryKey: ['history', ticket.id] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toastApi.success(`Đã phân công cho ${updated.technician_name ?? 'kỹ thuật viên'}`);
      onClose();
    },
    onError: () => toastApi.error('Không phân công được. Vui lòng thử lại.'),
  });

  return (
    <Modal open={open} title="Phân công kỹ thuật viên" onClose={onClose}>
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : isError ? (
        <ErrorState title="Không tải được danh sách KTV" onRetry={() => refetch()} />
      ) : techs.length === 0 ? (
        <p>Chưa có kỹ thuật viên nào.</p>
      ) : (
        <div role="radiogroup" aria-label="Kỹ thuật viên" className={styles.techList}>
          {techs.map((t) => {
            const full = t.current_load >= t.max_concurrent_tickets;
            const pct = Math.min(100, Math.round((t.current_load / Math.max(t.max_concurrent_tickets, 1)) * 100));
            return (
              <label key={t.id} className={`${styles.tech} ${picked === t.id ? styles.techOn : ''}`}>
                <input
                  type="radio"
                  name="technician"
                  value={t.id}
                  checked={picked === t.id}
                  disabled={!t.is_available}
                  onChange={() => setPicked(t.id)}
                />
                <span className={styles.techBody}>
                  <strong>
                    {t.full_name}
                    {t.id === recommended && <span className={styles.recBadge}>Đề xuất</span>}
                    {!t.is_available && <span className={styles.offBadge}>Không sẵn sàng</span>}
                  </strong>
                  <span className={styles.techMeta}>
                    {t.specialty.map((s) => categoryMeta(s).label).join(', ') || 'Chưa khai báo chuyên môn'}
                  </span>
                  <span className={styles.techLoad}>
                    <span
                      role="progressbar"
                      aria-label={`Tải của ${t.full_name}`}
                      aria-valuemin={0}
                      aria-valuemax={t.max_concurrent_tickets}
                      aria-valuenow={t.current_load}
                      className={styles.slaTrack}
                    >
                      <span className={`${styles.slaBar} ${full ? styles['bar-overdue'] : styles['bar-ok']}`} style={{ width: `${pct}%`, display: 'block' }} />
                    </span>
                    <span className="tabular">
                      {t.current_load}/{t.max_concurrent_tickets} ticket{full ? ' · đã đầy' : ''}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}
      <div className={styles.modalActions}>
        <Button variant="secondary" onClick={onClose} disabled={assign.isPending}>
          Huỷ bỏ
        </Button>
        <Button onClick={() => assign.mutate()} loading={assign.isPending} disabled={!picked || techs.length === 0}>
          Xác nhận phân công
        </Button>
      </div>
    </Modal>
  );
}
