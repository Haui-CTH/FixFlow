// SPDX-License-Identifier: Apache-2.0
// Tabs (P5.3): role=tablist/tab, mũi tên trái/phải, Home/End. Nội dung do nơi dùng render bằng tabPanelProps().

import { useRef } from 'react';
import styles from './ui.module.css';

export interface TabDef {
  id: string;
  label: string;
  count?: number;
}

export const tabPanelProps = (id: string) => ({
  role: 'tabpanel' as const,
  id: `panel-${id}`,
  'aria-labelledby': `tab-${id}`,
  tabIndex: 0,
});

export function Tabs({ tabs, active, onChange }: { tabs: TabDef[]; active: string; onChange: (id: string) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const last = tabs.length - 1;
    const next = e.key === 'ArrowRight' ? (i === last ? 0 : i + 1) : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  };

  return (
    <div className={styles.tabsWrap}>
      <div role="tablist" className={styles.tabs}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === active}
            aria-controls={`panel-${t.id}`}
            tabIndex={t.id === active ? 0 : -1}
            className={`${styles.tab} ${t.id === active ? styles.tabOn : ''}`}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
            {t.count !== undefined && <span className={styles.tabCount}>{t.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
