// DX-FSM Login Page
import { login } from '../lib/auth';
import styles from './Login.module.css';

export default function Login() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>DX-FSM</h1>
        <p className={styles.subtitle}>Field Service Management Platform</p>
        <button className={styles.button} onClick={login}>
          Đăng nhập với SSO
        </button>
      </div>
    </div>
  );
}
