// SPDX-License-Identifier: Apache-2.0
// AssignModal (P5.11): chọn KTV theo tải/chuyên môn, kết hợp gợi ý từ AI Recommender.
// Nếu AI Service trả về gợi ý, hiển thị điểm số và lý do đề xuất; nếu AI offline, tự động fallback sang chấm điểm client.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ticketApi, userApi, aiApi, type Technician, type Ticket, type AiTechnicianRec } from '../../lib/api';
import { categoryMeta } from '../../lib/ticket-meta';
import { toastApi } from '../../lib/toast';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ErrorState } from '../ui/States';
import { SkeletonRows } from '../ui/Skeleton';
import styles from './TicketDetail.module.css';
import { t as tr } from '../../lib/i18n';

// Client-side fallback: khớp chuyên môn > còn rảnh > tải thấp nhất. null nếu không ai nhận được.
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

  // Gợi ý từ AI Service (Multi-factor scoring + Collaborative Filtering)
  const { data: aiRecs = [] } = useQuery<AiTechnicianRec[]>({
    queryKey: ['ai-recommend', ticket.id, ticket.category, ticket.priority],
    queryFn: () =>
      aiApi.recommend({
        ticket_id: ticket.ticket_number || ticket.id,
        title: ticket.title,
        description: ticket.description || '',
        category: ticket.category,
        priority: ticket.priority,
      }),
    enabled: open && !!ticket.id,
    staleTime: 60_000,
  });

  // Xác định KTV được đề xuất: Ưu tiên gợi ý AI top 1, fallback sang rule client
  const clientRecommended = recommendTechnician(techs, ticket.category);
  const topAiRec = aiRecs.length > 0 ? aiRecs[0] : null;
  const topAiTech = topAiRec
    ? techs.find((t) => t.id === topAiRec.technician_id || t.employee_code === topAiRec.employee_code)
    : null;
  const recommended = topAiTech ? topAiTech.id : clientRecommended;

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
      toastApi.success(tr('assign_modal.assigned_to', { name: updated.technician_name ?? tr('assign_modal.ky_thuat_vien') }));
      onClose();
    },
    onError: () => toastApi.error(tr('assign_modal.khong_phan_cong_duoc_vui_long_thu')),
  });

  return (
    <Modal open={open} title={tr('assign_modal.phan_cong_ky_thuat_vien')} onClose={onClose}>
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : isError ? (
        <ErrorState title={tr('assign_modal.khong_tai_duoc_danh_sach_ktv')} onRetry={() => refetch()} />
      ) : techs.length === 0 ? (
        <p>{tr('assign_modal.chua_co_ky_thuat_vien_nao')}</p>
      ) : (
        <div role="radiogroup" aria-label={tr('assign_modal.ky_thuat_vien_2')} className={styles.techList}>
          {techs.map((t) => {
            const full = t.current_load >= t.max_concurrent_tickets;
            const pct = Math.min(100, Math.round((t.current_load / Math.max(t.max_concurrent_tickets, 1)) * 100));
            const aiRec = aiRecs.find((r) => r.technician_id === t.id || r.employee_code === t.employee_code);
            const isRecommended = t.id === recommended;

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
                    {isRecommended && (
                      <span className={styles.recBadge}>
                        {aiRec ? `AI Đề xuất (${Math.round(aiRec.score)}%)` : tr('assign_modal.de_xuat')}
                      </span>
                    )}
                    {!t.is_available && <span className={styles.offBadge}>{tr('assign_modal.khong_san_sang')}</span>}
                  </strong>
                  <span className={styles.techMeta}>
                    {t.specialty.map((s) => categoryMeta(s).label).join(', ') || tr('assign_modal.chua_khai_bao_chuyen_mon')}
                    {aiRec && aiRec.reasons.length > 0 && ` · ${aiRec.reasons.join(', ')}`}
                  </span>
                  <span className={styles.techLoad}>
                    <span
                      role="progressbar"
                      aria-label={tr('assign_modal.load_aria', { name: t.full_name })}
                      aria-valuemin={0}
                      aria-valuemax={t.max_concurrent_tickets}
                      aria-valuenow={t.current_load}
                      className={styles.slaTrack}
                    >
                      <span className={`${styles.slaBar} ${full ? styles['bar-overdue'] : styles['bar-ok']}`} style={{ width: `${pct}%`, display: 'block' }} />
                    </span>
                    <span className="tabular">
                      {t.current_load}/{t.max_concurrent_tickets} ticket{full ? tr('assign_modal.da_day') : ''}
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
          {tr('assign_modal.huy_bo')}
        </Button>
        <Button onClick={() => assign.mutate()} loading={assign.isPending} disabled={!picked || techs.length === 0}>
          {tr('assign_modal.xac_nhan_phan_cong')}
        </Button>
      </div>
    </Modal>
  );
}
