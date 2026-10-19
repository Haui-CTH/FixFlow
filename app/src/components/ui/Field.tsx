// SPDX-License-Identifier: Apache-2.0
// DX-FSM Field + Input/Select/Textarea (D1.11) — label hiển thị, helper/error nối aria-describedby.

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './ui.module.css';

interface FieldProps {
  label: string;
  helper?: string;
  error?: string;
}

function makeControl<E extends HTMLElement, P extends object>(Tag: 'input' | 'select' | 'textarea') {
  return forwardRef<E, P & FieldProps>(function Control({ label, helper, error, ...rest }, ref) {
    const id = useId();
    const describedBy = [helper && `${id}-h`, error && `${id}-e`].filter(Boolean).join(' ') || undefined;
    const props = {
      ...rest,
      id,
      ref,
      className: styles.control,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy,
    };
    return (
      <div className={styles.field}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(Tag === 'input' ? <input {...(props as any)} /> : Tag === 'select' ? <select {...(props as any)} /> : <textarea {...(props as any)} />)}
        {helper && (
          <span id={`${id}-h`} className={styles.helper}>
            {helper}
          </span>
        )}
        {error && (
          <span id={`${id}-e`} className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  });
}

export const Input = makeControl<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>('input');
export const Select = makeControl<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>('select');
export const Textarea = makeControl<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>('textarea');
