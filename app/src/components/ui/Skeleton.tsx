// SPDX-License-Identifier: Apache-2.0
// DX-FSM Skeleton (D1.9) — giữ chiều cao cố định để tránh nhảy layout; shimmer tắt khi reduced-motion (CSS).

import styles from './ui.module.css';

type Dim = number | string;

export function Skeleton({ width = '100%', height = 16 }: { width?: Dim; height?: Dim }) {
  return <span className={styles.skeleton} style={{ width, height }} aria-hidden="true" />;
}

export const SkeletonLine = () => <Skeleton height={16} />;
export const SkeletonBlock = ({ height = 120 }: { height?: Dim }) => <Skeleton height={height} />;

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Đang tải" style={{ display: 'grid', gap: 'var(--space-3)' }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={44} />
      ))}
    </div>
  );
}
