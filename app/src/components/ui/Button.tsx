// SPDX-License-Identifier: Apache-2.0
// DX-FSM Button (D1.6). Icon-only bắt buộc aria-label; loading chặn double submit.

import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './ui.module.css';

type Common = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  loading?: boolean;
  children: ReactNode;
};
// icon-only: không có chữ => bắt buộc aria-label (kiểm bằng kiểu)
type Props = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  ({ iconOnly?: false } | { iconOnly: true; 'aria-label': string });

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: Props) {
  const cls = [styles.btn, styles[variant], size === 'sm' && styles.sm, iconOnly && styles.iconOnly, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button {...rest} type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading && <Loader2 size={16} className={styles.spin} aria-hidden="true" />}
      {children}
    </button>
  );
}
