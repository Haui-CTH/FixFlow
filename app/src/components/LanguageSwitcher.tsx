// SPDX-License-Identifier: Apache-2.0
// LanguageSwitcher (I9.6): VI | EN. Đổi tức thì (main.tsx remount cây UI), không reload trang.

import { currentLang, LANGS, setLang, t, type Lang } from '../lib/i18n';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const active = currentLang();
  return (
    <div role="group" aria-label={t('lang.label')} className={styles.group}>
      {LANGS.map((l: Lang) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-label={t(`lang.${l}`)}
          aria-pressed={l === active}
          className={`${styles.btn} ${l === active ? styles.on : ''}`}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
