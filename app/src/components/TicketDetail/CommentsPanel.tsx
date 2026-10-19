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
    onError: () => toastApi.error('Không gửi được bình luận. Vui lòng thử lại.'),
  });

  const remove = useMutation({
    mutationFn: (c: TicketComment) => commentApi.remove(ticketId, c.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['history', ticketId] });
      toastApi.success('Đã xoá bình luận');
    },
    onError: () => toastApi.error('Không xoá được bình luận.'),
    onSettled: () => setToDelete(null),
  });

  const canDelete = (c: TicketComment) => role === 'manager' || role === 'admin' || (!!me?.user_id && c.user_id === me.user_id);

  return (
    <Card>
      <h2 className={styles.h2}>Bình luận</h2>
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : isError ? (
        <ErrorState title="Không tải được bình luận" onRetry={() => refetch()} />
      ) : comments.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Chưa có bình luận" description="Hãy là người đầu tiên bình luận." />
      ) : (
        <ul className={styles.comments}>
          {comments.map((c) => (
            <li key={c.id} className={styles.comment}>
              <span className={styles.avatar} aria-hidden="true">
                {(c.user_name || '?').charAt(0)}
              </span>
              <div className={styles.commentBody}>
                <div className={styles.commentHead}>
                  <strong>{c.user_name || 'Ẩn danh'}</strong>
                  {c.is_internal && <span className={styles.internal}>Nội bộ</span>}
                  <time className={styles.muted} dateTime={c.created_at ?? undefined}>
                    {formatRelative(c.created_at)}
                  </time>
                </div>
                <p className={styles.commentText}>{c.content}</p>
              </div>
              {canDelete(c) && (
                <Button variant="ghost" iconOnly aria-label="Xoá bình luận" onClick={() => setToDelete(c)}>
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
        <Textarea label="Viết bình luận" value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} />
        <div className={styles.formRow}>
          {isStaff && (
            <label className={styles.check}>
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              Nội bộ (khách hàng không thấy)
            </label>
          )}
          <Button type="submit" loading={post.isPending} disabled={!text.trim()}>
            Gửi
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={!!toDelete}
        title="Xoá bình luận"
        message="Xoá bình luận này? Thao tác không thể hoàn tác."
        confirmLabel="Xoá"
        danger
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </Card>
  );
}
