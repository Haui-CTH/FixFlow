// SPDX-License-Identifier: Apache-2.0
// DX-FSM Toast notification system (F5.6)
// Lightweight toast store + provider. Auto-dismiss, manual close,
// 4 types (info/success/warning/error).

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import styles from './toast.module.css';

// ─── Types ───────────────────────────────────────────────

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

// ─── Store (module-level subscription pattern) ────────────

const STORAGE_KEY = '__dxfsm_toast_store__';
type Listener = (toasts: Toast[]) => void;
let _toasts: Toast[] = [];
let _listeners: Set<Listener> = new Set();

function getStore(): Toast[] {
  return _toasts;
}

function setStore(next: Toast[]): void {
  _toasts = next;
  // persist for HMR
  if (typeof window !== 'undefined') {
    (window as any)[STORAGE_KEY] = next;
  }
  _listeners.forEach((l) => l(next));
}

function subscribe(listener: Listener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function genId(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  info: 4000,
  success: 4000,
  warning: 5000,
  error: 6000,
};

interface AddToastInput {
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

function addToast(input: AddToastInput): string {
  const id = genId();
  const durationMs = input.durationMs ?? DEFAULT_DURATIONS[input.type];
  const toast: Toast = {
    id,
    type: input.type,
    title: input.title,
    message: input.message,
    durationMs,
  };
  setStore([..._toasts, toast]);

  if (durationMs > 0) {
    setTimeout(() => dismissToast(id), durationMs);
  }
  return id;
}

function dismissToast(id: string): void {
  setStore(_toasts.filter((t) => t.id !== id));
}

function clearAllToasts(): void {
  setStore([]);
}

// Restore from HMR cache
if (typeof window !== 'undefined' && (window as any)[STORAGE_KEY]) {
  _toasts = (window as any)[STORAGE_KEY];
}

// ─── Public API (used outside React too) ─────────────────

export const toastApi = {
  show: addToast,
  success: (message: string, title?: string) =>
    addToast({ type: 'success', message, title }),
  error: (message: string, title?: string) =>
    addToast({ type: 'error', message, title }),
  warning: (message: string, title?: string) =>
    addToast({ type: 'warning', message, title }),
  info: (message: string, title?: string) =>
    addToast({ type: 'info', message, title }),
  dismiss: dismissToast,
  clear: clearAllToasts,
};

// ─── Context (for React components) ──────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>(() => getStore());

  useEffect(() => {
    return subscribe((next) => setToasts(next));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) =>
      addToast(t),
    []
  );
  const success = useCallback(
    (m: string, title?: string) => addToast({ type: 'success', message: m, title }),
    []
  );
  const error = useCallback(
    (m: string, title?: string) => addToast({ type: 'error', message: m, title }),
    []
  );
  const warning = useCallback(
    (m: string, title?: string) => addToast({ type: 'warning', message: m, title }),
    []
  );
  const info = useCallback(
    (m: string, title?: string) => addToast({ type: 'info', message: m, title }),
    []
  );
  const dismiss = useCallback((id: string) => dismissToast(id), []);
  const clear = useCallback(() => clearAllToasts(), []);

  return (
    <ToastContext.Provider
      value={{ toasts, toast, success, error, warning, info, dismiss, clear }}
    >
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Outside provider — fall back to direct API
    return {
      toasts: getStore(),
      toast: (t) => addToast(t),
      success: (m, t) => addToast({ type: 'success', message: m, title: t }),
      error: (m, t) => addToast({ type: 'error', message: m, title: t }),
      warning: (m, t) => addToast({ type: 'warning', message: m, title: t }),
      info: (m, t) => addToast({ type: 'info', message: m, title: t }),
      dismiss: dismissToast,
      clear: clearAllToasts,
    };
  }
  return ctx;
}

// ─── Viewport (renders all toasts) ───────────────────────

const ICONS: Record<ToastType, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

function ToastViewport() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div
      className={styles.viewport}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[t.type]}`}
          role={t.type === 'error' ? 'alert' : 'status'}
          aria-atomic="true"
        >
          <div className={styles.icon} aria-hidden="true">
            {(() => { const Icon = ICONS[t.type]; return <Icon size={18} />; })()}
          </div>
          <div className={styles.body}>
            {t.title && <div className={styles.title}>{t.title}</div>}
            <div className={styles.message}>{t.message}</div>
          </div>
          <button
            className={styles.close}
            onClick={() => dismiss(t.id)}
            aria-label="Đóng thông báo"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
