// SPDX-License-Identifier: Apache-2.0
// DX-FSM ErrorBoundary (F5.6)
// React error boundary: catches render errors, hiển thị fallback UI.

import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';
import { t } from '../lib/i18n';

interface Props {
  children: ReactNode;
  fallback?: (err: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log to console (production: send to telemetry)
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ error: null, errorInfo: null });
  };

  componentDidUpdate(prev: Props): void {
    // If children change (e.g. route change), reset error
    if (this.state.error && prev.children !== this.props.children) {
      this.reset();
    }
  }

  render(): ReactNode {
    const { error, errorInfo } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return <DefaultFallback error={error} errorInfo={errorInfo} onReset={this.reset} />;
  }
}

function DefaultFallback({
  error,
  errorInfo,
  onReset,
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('error_boundary.da_xay_ra_loi')}</h1>
        <p className={styles.desc}>
          {t('error_boundary.ung_dung_gap_loi_khong_mong_muon_b')}
        </p>
        <details className={styles.details}>
          <summary className={styles.summary}>
            {t('error_boundary.chi_tiet_loi_developer')}
          </summary>
          <pre className={styles.pre}>
            <strong>{error.name}: {error.message}</strong>
            {'\n\n'}
            {error.stack || '(no stack)'}
            {errorInfo && `\n\nComponent stack:\n${errorInfo.componentStack || ''}`}
          </pre>
        </details>
        <div className={styles.actions}>
          <button onClick={onReset} className={styles.primary}>
            {t('error_boundary.thu_lai')}
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            className={styles.secondary}
          >
            {t('error_boundary.ve_trang_chu')}
          </button>
        </div>
      </div>
    </div>
  );
}
