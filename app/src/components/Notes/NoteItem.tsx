// SPDX-License-Identifier: Apache-2.0
// DX-FSM NoteItem – single note row (F5.3)

import type { Note } from '../../lib/notes';
import { formatNoteTime } from '../../lib/notes';
import styles from './NotesPanel.module.css';

interface NoteItemProps {
  note: Note;
}

function getInitials(name: string | null, id: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return id.slice(0, 2).toUpperCase();
}

export function NoteItem({ note }: NoteItemProps) {
  const displayName = note.author_name || note.author_id.slice(0, 8);
  return (
    <div className={styles.note}>
      <div className={styles.noteHeader}>
        <div className={styles.noteAuthor}>
          <div className={styles.authorAvatar} aria-hidden="true">
            {getInitials(note.author_name, note.author_id)}
          </div>
          {displayName}
        </div>
        <time className={styles.noteTime} dateTime={note.created_at}>
          {formatNoteTime(note.created_at)}
        </time>
      </div>
      <p className={styles.noteBody}>{note.body}</p>
    </div>
  );
}
