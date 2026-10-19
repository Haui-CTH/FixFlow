// SPDX-License-Identifier: Apache-2.0
// DX-FSM NoteComposer – form to add note (F5.3)
// Chỉ nhân viên. Validates body, shows char count, handles submit.

import { useState } from 'react';
import { validateNoteBody, normalizeNoteBody } from '../../lib/notes';
import styles from './NotesPanel.module.css';

const MAX_BODY = 5000;

interface NoteComposerProps {
  onSubmit: (body: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function NoteComposer({ onSubmit, isSubmitting = false }: NoteComposerProps) {
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);

  const trimmed = body.trim();
  const isEmpty = trimmed.length === 0;
  const isOverLimit = body.length > MAX_BODY;
  const isDisabled = isEmpty || isOverLimit || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateNoteBody(body);
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map((v) => v.message));
      setShowError(true);
      return;
    }

    setShowError(false);
    setErrors([]);
    try {
      await onSubmit(normalizeNoteBody(body));
      setBody(''); // clear on success
    } catch (err) {
      // Parent handles error display, just keep body
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const charCountClass = isOverLimit
    ? styles.charCountError
    : body.length > MAX_BODY * 0.9
    ? styles.charCountWarn
    : '';

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <textarea
        className={`${styles.textarea} ${showError && isEmpty ? styles.textareaError : ''}`}
        placeholder="Viết note nội bộ... (Cmd/Ctrl+Enter để gửi)"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (showError) setShowError(false);
        }}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        aria-label="Nội dung note"
        maxLength={MAX_BODY + 100} // allow slight over for visual feedback
      />

      {showError && errors.length > 0 && (
        <div className={styles.errorMsg} role="alert">
          {errors.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      )}

      <div className={styles.composerFooter}>
        <span className={`${styles.charCount} ${charCountClass}`}>
          {body.length} / {MAX_BODY}
        </span>
        <div className={styles.composerActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => {
              setBody('');
              setErrors([]);
              setShowError(false);
            }}
            disabled={isSubmitting || (!body && !showError)}
          >
            Xóa
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isDisabled}
          >
            {isSubmitting ? 'Đang gửi…' : 'Gửi note'}
          </button>
        </div>
      </div>
    </form>
  );
}
