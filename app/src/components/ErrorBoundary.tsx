// SPDX-License-Identifier: Apache-2.0
// DX-FSM ErrorBoundary (F5.6)
// React error boundary: catches render errors, hiển thị fallback UI.

import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

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
        <h1 className={styles.title}>Đã xảy ra lỗi</h1>
        <p className={styles.desc}>
          Ứng dụng gặp lỗi không mong muốn. Bạn có thể thử lại hoặc quay về trang chủ.
        </p>
        <details className={styles.details}>
          <summary className={styles.summary}>
            Chi tiết lỗi (developer)
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
            Thử lại
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            className={styles.secondary}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
