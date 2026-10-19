// SPDX-License-Identifier: Apache-2.0
// DX-FSM Notes API client (F5.3)
// BE Sprint 4: GET/POST /tickets/{id}/notes (staff only).

import { api } from './api';
import { locale, t } from './i18n';

// ─── Types (mirror BE NoteResponse) ─────────────────────

export interface Note {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  body: string;
}

export interface NotesListResponse {
  items: Note[];
  total: number;
}

// ─── API ────────────────────────────────────────────────

export const notesApi = {
  list: async (ticketId: string): Promise<Note[]> => {
    const r = await api.get<Note[]>(`/tickets/${ticketId}/notes`);
    return r.data;
  },

  create: async (ticketId: string, body: string): Promise<Note> => {
    const r = await api.post<Note>(`/tickets/${ticketId}/notes`, { body });
    return r.data;
  },
};

// ─── Helpers (exported for testing) ─────────────────────

/**
 * Check if user role is staff (can view/create notes).
 * Customer 403 → hide the panel entirely.
 */
export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'technician' || role === 'manager' || role === 'admin';
}

const MAX_BODY = 5000;

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate note body theo rule BE (khớp backend):
 *  - body.trim() không rỗng
 *  - max 5000 chars
 *  - không phải chỉ whitespace
 *
 * Returns ValidationError[] — rỗng = valid.
 */
export function validateNoteBody(body: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const trimmed = body.trim();

  if (trimmed.length === 0) {
    errors.push({ field: 'body', message: t('notes.empty') });
  }
  if (body.length > MAX_BODY) {
    errors.push({
      field: 'body',
      message: t('notes.too_long', { max: MAX_BODY, current: body.length }),
    });
  }
  return errors;
}

/**
 * Strip leading/trailing whitespace từ body — same as BE.
 * Returns "" nếu toàn whitespace.
 */
export function normalizeNoteBody(body: string): string {
  return body.trim();
}

/**
 * Format relative time: s/m/h/d.
 * Re-export từ notifications helper để share format.
 */
export function formatNoteTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return t('time.s_ago', { n: diffSec });
  if (diffSec < 3600) return t('time.m_ago', { n: Math.floor(diffSec / 60) });
  if (diffSec < 86400) return t('time.h_ago', { n: Math.floor(diffSec / 3600) });
  if (diffSec < 7 * 86400) return t('time.d_ago', { n: Math.floor(diffSec / 86400) });
  return new Date(iso).toLocaleDateString(locale());
}
