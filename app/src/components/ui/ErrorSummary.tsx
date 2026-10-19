// SPDX-License-Identifier: Apache-2.0
// ErrorSummary (C4.4): danh sách lỗi đầu form, mỗi mục focus tới field tương ứng. Tự nhận focus khi hiện.

import { useEffect, useRef } from 'react';
import styles from './ui.module.css';

export interface FieldError {
  name: string;
  message: string;
}

export function ErrorSummary({ errors }: { errors: FieldError[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = errors.map((e) => e.name).join(',');
  useEffect(() => {
    if (errors.length) ref.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (errors.length === 0) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className={styles.errorSummary}>
      <strong>Có {errors.length} mục cần sửa:</strong>
      <ul>
        {errors.map((e) => (
          <li key={e.name}>
            <a
              href={`#${e.name}`}
              onClick={(ev) => {
                ev.preventDefault();
                document.querySelector<HTMLElement>(`[name="${e.name}"]`)?.focus();
              }}
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
