// SPDX-License-Identifier: Apache-2.0
// CommentsPanel (P5.7): danh sách bình luận, gửi (tick "Nội bộ" cho staff), xoá có xác nhận.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMe } from '../../hooks/useMe';
import { commentApi, type TicketComment } from '../../lib/api';
import type { Role } from '../../lib/auth';
import { formatRelative } from '../../lib/format';
import { toastApi } from '../../lib/toast';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Textarea } from '../ui/Field';
import { SkeletonRows } from '../ui/Skeleton';
import { EmptyState, ErrorState } from '../ui/States';
import styles from './TicketDetail.module.css';
import { t } from '../../lib/i18n';

export function CommentsPanel({ ticketId, role }: { ticketId: string; role: Role | null }) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isStaff = role !== 'customer';
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [toDelete, setToDelete] = useState<TicketComment | null>(null);

  const key = ['comments', ticketId];
  const { data: comments = [], isLoading, isError, refetch } = useQuery({
    queryKey: key,
    queryFn: () => commentApi.list(ticketId),
  });

  const post = useMutation({
    mutationFn: () => commentApi.post(ticketId, text.trim(), isStaff && internal),
    onSuccess: () => {
      setText('');
      setInternal(false);
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['history', ticketId] });
    },
    onError: () => toastApi.error(t('comments_panel.khong_gui_duoc_binh_luan_vui_long')),
  });

  const remove = useMutation({
    mutationFn: (c: TicketComment) => commentApi.remove(ticketId, c.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['history', ticketId] });
      toastApi.success(t('comments_panel.da_xoa_binh_luan'));
    },
    onError: () => toastApi.error(t('comments_panel.khong_xoa_duoc_binh_luan')),
    onSettled: () => setToDelete(null),
  });

  const canDelete = (c: TicketComment) => role === 'manager' || role === 'admin' || (!!me?.user_id && c.user_id === me.user_id);

  return (
    <Card>
      <h2 className={styles.h2}>{t('comments_panel.binh_luan')}</h2>
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : isError ? (
        <ErrorState title={t('comments_panel.khong_tai_duoc_binh_luan')} onRetry={() => refetch()} />
      ) : comments.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t('comments_panel.chua_co_binh_luan')} description={t('comments_panel.hay_la_nguoi_dau_tien_binh_luan')} />
      ) : (
        <ul className={styles.comments}>
          {comments.map((c) => (
            <li key={c.id} className={styles.comment}>
              <span className={styles.avatar} aria-hidden="true">
                {(c.user_name || '?').charAt(0)}
              </span>
              <div className={styles.commentBody}>
                <div className={styles.commentHead}>
                  <strong>{c.user_name || t('comments_panel.an_danh')}</strong>
                  {c.is_internal && <span className={styles.internal}>{t('comments_panel.noi_bo')}</span>}
                  <time className={styles.muted} dateTime={c.created_at ?? undefined}>
                    {formatRelative(c.created_at)}
                  </time>
                </div>
                <p className={styles.commentText}>{c.content}</p>
              </div>
              {canDelete(c) && (
                <Button variant="ghost" iconOnly aria-label={t('comments_panel.xoa_binh_luan')} onClick={() => setToDelete(c)}>
                  <Trash2 size={18} aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        className={styles.commentForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) post.mutate();
        }}
      >
        <Textarea label={t('comments_panel.viet_binh_luan')} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} />
        <div className={styles.formRow}>
          {isStaff && (
            <label className={styles.check}>
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              {t('comments_panel.noi_bo_khach_hang_khong_thay')}
            </label>
          )}
          <Button type="submit" loading={post.isPending} disabled={!text.trim()}>
            {t('comments_panel.gui')}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={!!toDelete}
        title={t('comments_panel.xoa_binh_luan')}
        message={t('comments_panel.xoa_binh_luan_nay_thao_tac_khong_t')}
        confirmLabel={t('comments_panel.xoa')}
        danger
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </Card>
  );
}
