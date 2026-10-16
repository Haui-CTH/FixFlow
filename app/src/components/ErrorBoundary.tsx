// SPDX-License-Identifier: Apache-2.0
// DX-FSM ErrorBoundary (F5.6)
// React error boundary: catches render errors, hiển thị fallback UI.

import { Component, type ErrorInfo, type ReactNode } from 'react';

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
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Đã xảy ra lỗi</h1>
        <p style={descStyle}>
          Ứng dụng gặp lỗi không mong muốn. Bạn có thể thử lại hoặc quay về trang chủ.
        </p>
        <details style={detailsStyle}>
          <summary style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
            Chi tiết lỗi (developer)
          </summary>
          <pre style={preStyle}>
            <strong>{error.name}: {error.message}</strong>
            {'\n\n'}
            {error.stack || '(no stack)'}
            {errorInfo && `\n\nComponent stack:\n${errorInfo.componentStack || ''}`}
          </pre>
        </details>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={onReset} style={primaryBtnStyle}>
            Thử lại
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={secondaryBtnStyle}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: 'var(--bg)',
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  padding: '2rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--border)',
  maxWidth: '32rem',
  width: '100%',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--danger)',
  marginBottom: '0.5rem',
};

const descStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  marginBottom: '1rem',
  lineHeight: 1.6,
};

const detailsStyle: React.CSSProperties = {
  background: 'var(--bg)',
  padding: '0.75rem',
  borderRadius: '0.375rem',
  marginBottom: '0.5rem',
};

const preStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontFamily: 'ui-monospace, "SF Mono", monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  marginTop: '0.5rem',
  color: 'var(--text-primary)',
  maxHeight: '12rem',
  overflowY: 'auto',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'var(--primary)',
  color: 'white',
  border: 'none',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  fontWeight: 500,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'white',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  fontWeight: 500,
};
