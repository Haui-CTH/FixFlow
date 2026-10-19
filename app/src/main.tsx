// SPDX-License-Identifier: Apache-2.0
import React, { Fragment, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './lib/toast';
import '@fontsource-variable/plus-jakarta-sans';
import './index.css';
import './lib/i18n';
import { initTheme } from './lib/theme';

initTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Đổi ngôn ngữ: remount cây UI để mọi t() được đánh giá lại (dữ liệu query vẫn giữ trong cache).
function I18nRoot({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  return <Fragment key={i18n.language}>{children}</Fragment>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <I18nRoot>
            <App />
          </I18nRoot>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
