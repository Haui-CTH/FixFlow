// DX-FSM Login Page
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initKeycloak, login } from '../lib/auth';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

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
      <div className={styles.card}>
        <h1 className={styles.title}>DX-FSM</h1>
        <p className={styles.subtitle}>Field Service Management Platform</p>
        <button className={styles.button} onClick={login} disabled={!ready}>
          Đăng nhập với SSO
        </button>
      </div>
    </div>
  );
}
