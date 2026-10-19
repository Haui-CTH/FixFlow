// SPDX-License-Identifier: Apache-2.0
// AttachmentsPanel (P5.9): lưới file, xem trước ảnh (Modal), tải về, upload bằng FileDropzone, xoá có xác nhận.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, FileText, Paperclip, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMe } from '../../hooks/useMe';
import { attachmentApi, type Attachment } from '../../lib/api';
import type { Role } from '../../lib/auth';
import { formatDate } from '../../lib/format';
import { toastApi } from '../../lib/toast';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { FileDropzone } from '../ui/FileDropzone';
import { Modal } from '../ui/Modal';
import { SkeletonRows } from '../ui/Skeleton';
import { EmptyState, ErrorState } from '../ui/States';
import styles from './TicketDetail.module.css';
import { t } from '../../lib/i18n';

const kb = (n?: number | null) => (!n ? '' : n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const isImage = (a: Attachment) => !!a.mime_type?.startsWith('image/');

// Tải blob (có Authorization) -> object URL; thu hồi khi huỷ
function useBlobUrl(ticketId: string, a: Attachment, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let obj: string | null = null;
    attachmentApi
      .blob(ticketId, a.id)
      .then((b) => {
        if (!alive) return;
        obj = URL.createObjectURL(b);
        setUrl(obj);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [ticketId, a.id, enabled]);
  return url;
}

function Thumb({ ticketId, a }: { ticketId: string; a: Attachment }) {
  const url = useBlobUrl(ticketId, a, isImage(a));
  return isImage(a) && url ? (
    <img src={url} alt={a.file_name} className={styles.thumb} />
  ) : (
    <span className={styles.thumb} aria-hidden="true">
      <FileText size={32} />
    </span>
  );
}

export function AttachmentsPanel({ ticketId, role }: { ticketId: string; role: Role | null }) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [toDelete, setToDelete] = useState<Attachment | null>(null);
  const previewUrl = useBlobUrl(ticketId, preview ?? ({ id: '' } as Attachment), !!preview);

  const key = ['attachments', ticketId];
  const { data: items = [], isLoading, isError, refetch } = useQuery({ queryKey: key, queryFn: () => attachmentApi.list(ticketId) });

  const upload = useMutation({
    mutationFn: async () => {
      let failed = 0;
      for (const f of files) {
        try {
          await attachmentApi.upload(ticketId, f);
        } catch {
          failed++;
        }
      }
      return failed;
    },
    onSuccess: (failed) => {
      setFiles([]);
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['history', ticketId] });
      if (failed) toastApi.warning(t('attachments_panel.upload_failed', { count: failed }));
      else toastApi.success(t('attachments_panel.da_tai_len'));
    },
  });

  const remove = useMutation({
    mutationFn: (a: Attachment) => attachmentApi.remove(ticketId, a.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['history', ticketId] });
      toastApi.success(t('attachments_panel.da_xoa_file'));
    },
    onError: () => toastApi.error(t('attachments_panel.khong_xoa_duoc_file')),
    onSettled: () => setToDelete(null),
  });

  const download = async (a: Attachment) => {
    try {
      const blob = await attachmentApi.blob(ticketId, a.id);
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = a.file_name;
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      toastApi.error(t('attachments_panel.khong_tai_duoc_file'));
    }
  };

  const canDelete = (a: Attachment & { user_id?: string | null }) => role !== 'customer' || (!!me?.user_id && a.user_id === me.user_id);

  return (
    <Card>
      <h2 className={styles.h2}>{t('attachments_panel.dinh_kem')}</h2>
      {isLoading ? (
        <SkeletonRows rows={2} />
      ) : isError ? (
        <ErrorState title={t('attachments_panel.khong_tai_duoc_dinh_kem')} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={Paperclip} title={t('attachments_panel.chua_co_file_dinh_kem')} />
      ) : (
        <ul className={styles.files}>
          {items.map((a) => (
            <li key={a.id} className={styles.file}>
              <Thumb ticketId={ticketId} a={a} />
              <div className={styles.fileInfo}>
                <strong className={styles.fileName}>{a.file_name}</strong>
                <span className={styles.muted}>
                  {kb(a.file_size)} · {a.user_name || t('attachments_panel.an_danh')} · {formatDate(a.created_at)}
                </span>
              </div>
              <div className={styles.fileBtns}>
                {isImage(a) && (
                  <Button variant="ghost" iconOnly aria-label={`Xem ${a.file_name}`} onClick={() => setPreview(a)}>
                    <Eye size={18} aria-hidden="true" />
                  </Button>
                )}
                <Button variant="ghost" iconOnly aria-label={t('attachments_panel.download', { name: a.file_name })} onClick={() => download(a)}>
                  <Download size={18} aria-hidden="true" />
                </Button>
                {canDelete(a) && (
                  <Button variant="ghost" iconOnly aria-label={t('attachments_panel.remove', { name: a.file_name })} onClick={() => setToDelete(a)}>
                    <Trash2 size={18} aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className={styles.h3}>{t('attachments_panel.them_file')}</h3>
      <FileDropzone files={files} onChange={setFiles} />
      {files.length > 0 && (
        <div className={styles.formRow}>
          <Button onClick={() => upload.mutate()} loading={upload.isPending}>
            {t('attachments_panel.upload_n', { count: files.length })}
          </Button>
        </div>
      )}

      <Modal open={!!preview} title={preview?.file_name ?? ''} onClose={() => setPreview(null)}>
        {previewUrl ? <img src={previewUrl} alt={preview?.file_name} className={styles.previewImg} /> : <SkeletonRows rows={1} />}
      </Modal>
      <ConfirmDialog
        open={!!toDelete}
        title={t('attachments_panel.xoa_file')}
        message={t('attachments_panel.delete_msg', { name: toDelete?.file_name })}
        confirmLabel={t('attachments_panel.xoa')}
        danger
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </Card>
  );
}
