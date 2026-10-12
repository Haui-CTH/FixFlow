// DX-FSM Auth Guard
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initKeycloak } from '../lib/auth';
import { useAuthStore } from '../lib/store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initKeycloak()
      .then((authenticated) => {
        if (authenticated) {
          const token = localStorage.getItem('access_token');
          const userInfo = localStorage.getItem('user');
          if (token) {
            setAuth(token, userInfo ? JSON.parse(userInfo) : null);
          }
        } else {
          navigate('/login');
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate, setAuth]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>;
  return <>{children}</>;
}
