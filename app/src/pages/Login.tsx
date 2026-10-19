// DX-FSM Login Page (GĐ 02): 2 cột desktop, 1 cột mobile
import { ClipboardCheck, ShieldCheck, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/TopBar';
import { initKeycloak, login } from '../lib/auth';
import styles from './Login.module.css';

const POINTS = [
  { icon: ClipboardCheck, text: 'Theo dõi ticket từ tiếp nhận đến hoàn tất' },
  { icon: Zap, text: 'AI gợi ý phân loại và kỹ thuật viên phù hợp' },
  { icon: ShieldCheck, text: 'Đăng nhập một lần (SSO), phân quyền theo vai trò' },
];

export default function Login() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Keycloak must be initialised before login(); already signed in -> go to app
  useEffect(() => {
    initKeycloak()
      .then((authenticated) => {
        if (authenticated) navigate('/', { replace: true });
        else setReady(true);
      })
      .catch(() => setReady(true));
  }, [navigate]);

  return (
    <div className={styles.container}>
      <section className={styles.panel}>
        <div className={styles.brand}>
          <img src="/logo.svg" alt="" width={40} height={40} />
          <span>DX-FSM</span>
        </div>
        <h2 className={styles.tagline}>Quản lý dịch vụ thực địa</h2>
        <ul className={styles.points}>
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={20} aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </section>
      <main className={styles.formSide}>
        <div className={styles.theme}>
          <ThemeToggle />
        </div>
        <div className={styles.card}>
          <h1 className={styles.title}>Đăng nhập</h1>
          <p className={styles.subtitle}>Dùng tài khoản công ty của bạn để tiếp tục.</p>
          <Button
            className={styles.cta}
            disabled={!ready}
            loading={redirecting}
            onClick={() => {
              setRedirecting(true);
              login();
            }}
          >
            Đăng nhập với SSO
          </Button>
          <p className={styles.help}>Chưa có tài khoản? Liên hệ quản trị viên.</p>
          {import.meta.env.DEV && (
            <p className={styles.help}>Dev: tài khoản demo admin, manager, technician, customer.</p>
          )}
        </div>
      </main>
    </div>
  );
}
