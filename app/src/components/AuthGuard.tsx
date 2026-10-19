// DX-FSM Auth Guard
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import keycloak, { initKeycloak, getCurrentUser } from '../lib/auth';
import { useAuthStore } from '../lib/store';
import { SkeletonBlock } from './ui/Skeleton';
import { ErrorState } from './ui/States';

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
        title="Không kết nối được máy chủ đăng nhập"
        message="Kiểm tra mạng hoặc dịch vụ Keycloak rồi thử lại."
        onRetry={() => window.location.reload()}
      />
    );
  }
  if (state === 'loading') {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: 480, margin: '0 auto' }} role="status" aria-label="Đang tải">
        <SkeletonBlock height={240} />
      </div>
    );
  }
  return <>{children}</>;
}
