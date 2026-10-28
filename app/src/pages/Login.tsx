// SPDX-License-Identifier: Apache-2.0
// DX-FSM Login Page (GĐ 02): 2 cột desktop, 1 cột mobile
import { ClipboardCheck, ShieldCheck, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/TopBar';
import { initKeycloak, login } from '../lib/auth';
import styles from './Login.module.css';
import { t } from '../lib/i18n';

const POINTS = [
  { icon: ClipboardCheck, text: t('login.theo_doi_ticket_tu_tiep_nhan_den_h') },
  { icon: Zap, text: t('login.ai_goi_y_phan_loai_va_ky_thuat_vie') },
  { icon: ShieldCheck, text: t('login.dang_nhap_mot_lan_sso_phan_quyen_t') },
];

export default function Login() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    document.title = t('login.dang_nhap_dx_fsm');
  }, []);

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
          <span>FixFlow</span>
        </div>
        <p className={styles.tagline}>{t('login.quan_ly_dich_vu_thuc_dia')}</p>
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
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div className={styles.card}>
          <h1 className={styles.title}>{t('login.dang_nhap')}</h1>
          <p className={styles.subtitle}>{t('login.dung_tai_khoan_cong_ty_cua_ban_de')}</p>
          <Button
            className={styles.cta}
            disabled={!ready}
            loading={redirecting}
            onClick={() => {
              setRedirecting(true);
              login();
            }}
          >
            {t('login.dang_nhap_voi_sso')}
          </Button>
          <p className={styles.help}>{t('login.chua_co_tai_khoan_lien_he_quan_tri')}</p>
          {import.meta.env.DEV && (
            <p className={styles.help}>{t('login.dev_tai_khoan_demo_admin_manager_t')}</p>
          )}
        </div>
      </main>
    </div>
  );
}
