// SPDX-License-Identifier: Apache-2.0
// DX-FSM NotesPanel – list + composer cho staff (F5.3)

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notesApi,
  type Note,
  isStaffRole,
} from '../../lib/notes';
import { useAuthStore } from '../../lib/store';
import { NoteItem } from './NoteItem';
import { NoteComposer } from './NoteComposer';
import styles from './NotesPanel.module.css';
import { t } from '../../lib/i18n';

interface NotesPanelProps {
  ticketId: string;
}

export function NotesPanel({ ticketId }: NotesPanelProps) {
  const user = useAuthStore((s) => s.user);
  const isStaff = isStaffRole(user?.role);
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── List query ─────────────────────────────────────
  const {
    data: notes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notes', ticketId],
    queryFn: () => notesApi.list(ticketId),
    enabled: isStaff, // customer → skip query entirely
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, err: { response?: { status?: number } }) => {
      // Don't retry on 403 (customer role)
      if (err?.response?.status === 403) return false;
      return failureCount < 3;
    },
  });

  // ─── Create mutation ────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body: string) => notesApi.create(ticketId, body),
    onMutate: async (body) => {
      setSubmitError(null);
      // Optimistic insert
      await queryClient.cancelQueries({ queryKey: ['notes', ticketId] });
      const previous = queryClient.getQueryData<Note[]>(['notes', ticketId]) ?? [];

      const optimisticNote: Note = {
        id: `temp-${Date.now()}`,
        ticket_id: ticketId,
        author_id: user?.email ?? 'me',
        author_name: user?.username ?? null,
        body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Note[]>(
        ['notes', ticketId],
        [optimisticNote, ...previous]
      );

      return { previous };
    },
    onError: (err: { response?: { data?: { detail?: string } }; message?: string }, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notes', ticketId], context.previous);
      }
      setSubmitError(
        err?.response?.data?.detail || err?.message || t('notes_panel.loi_khi_tao_note')
      );
    },
    onSuccess: () => {
      setSubmitError(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', ticketId] });
    },
  });

  // Customer role: hide panel entirely
  if (!isStaff) {
    return null;
  }

  return (
    <section className={styles.panel} aria-label={t('notes_panel.ghi_chu_noi_bo')}>
      {/* Header */}
      <header className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon} aria-hidden="true">📝</span>
          {t('notes_panel.ghi_chu_noi_bo')}
          <span className={styles.staffBadge}>{t('notes_panel.chi_nhan_vien')}</span>
          <span className={styles.count}>({notes.length})</span>
        </h2>
      </header>

      {/* Composer */}
      <NoteComposer
        onSubmit={async (body) => {
          await createMutation.mutateAsync(body);
        }}
        isSubmitting={createMutation.isPending}
      />

      {/* Submit error (from mutation) */}
      {submitError && (
        <div className={styles.errorBox} role="alert">
          <span>{t('notes_panel.send_error', { error: submitError })}</span>
          <button onClick={() => setSubmitError(null)}>{t('notes_panel.dong')}</button>
        </div>
      )}

      {/* List states */}
      {isLoading && (
        <div className={styles.center}>
          <div className={styles.spinner} />
          <div>{t('notes_panel.dang_tai_notes')}</div>
        </div>
      )}

      {isError && (
        <div className={styles.errorBox} role="alert">
          <span>{t('notes_panel.load_error', { error: (error as Error)?.message || t('notes_panel.khong_ro') })}</span>
          <button onClick={() => refetch()}>{t('notes_panel.thu_lai')}</button>
        </div>
      )}

      {!isLoading && !isError && notes.length === 0 && (
        <div className={styles.empty}>
          {t('notes_panel.chua_co_note_nao_hay_them_note_noi')}
        </div>
      )}

      {!isLoading && !isError && notes.length > 0 && (
        <div className={styles.list}>
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </div>
      )}
    </section>
  );
}
