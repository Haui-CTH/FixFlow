// SPDX-License-Identifier: Apache-2.0
// DX-FSM Auth Guard
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import keycloak, { initKeycloak, getCurrentUser } from '../lib/auth';
import { useAuthStore } from '../lib/store';
import { SkeletonBlock } from './ui/Skeleton';
import styles from './ui/ui.module.css';
import { ErrorState } from './ui/States';
import { t } from '../lib/i18n';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    initKeycloak()
      .then((authenticated) => {
        if (authenticated) {
          setAuth(keycloak.token ?? '', getCurrentUser());
          setState('ok');
        } else {
          navigate('/login');
        }
      })
      .catch(() => setState('error'));
  }, [navigate, setAuth]);

  if (state === 'error') {
    return (
      <ErrorState
        headingLevel={1}
        title={t('auth_guard.khong_ket_noi_duoc_may_chu_dang_nh')}
        message={t('auth_guard.kiem_tra_mang_hoac_dich_vu_keycloa')}
        onRetry={() => window.location.reload()}
      />
    );
  }
  if (state === 'loading') {
    return (
      <div className={styles.loading} role="status" aria-label={t('auth_guard.dang_tai')}>
        <SkeletonBlock height={240} />
      </div>
    );
  }
  return <>{children}</>;
}
