// DX-FSM API Client
import axios from 'axios';
import { toastApi } from './toast';
import keycloak from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    await keycloak.updateToken(30).catch(() => undefined);
  }
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

// Response interceptor (F5.6: show toast on errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Avoid toast loop on login page
      if (!window.location.pathname.startsWith('/login')) {
        toastApi.warning('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại');
        keycloak.login({ redirectUri: window.location.href });
      }
    } else if (error.response?.status === 403) {
      toastApi.error('Bạn không có quyền thực hiện thao tác này', '403 Forbidden');
    } else if (error.response?.status === 404) {
      // Skip 404 toast — components often handle 404s explicitly
    } else if (error.response?.status === 500) {
      toastApi.error('Lỗi máy chủ, vui lòng thử lại sau', '500 Server Error');
    } else if (error.response?.status >= 500) {
      toastApi.error(`Lỗi ${error.response.status}: ${error.response.statusText || 'Server error'}`);
    } else if (!error.response) {
      // Network error
      toastApi.error('Không kết nối được tới máy chủ', 'Lỗi mạng');
    }
    return Promise.reject(error);
  }
);

// ─── Ticket API ────────────────────────────────────────────

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  customer_name?: string;
  technician_name?: string;
  created_at?: string;
  sla_deadline?: string;
}

export const ticketApi = {
  // Backend returns { items, total, ... }; callers only need the array for now
  list: (params?: { status?: string; priority?: string; category?: string }) =>
    api
      .get<{ items: Ticket[]; total: number }>('/tickets', { params })
      .then((r) => ({ ...r, data: r.data.items })),

  get: (id: string) =>
    api.get<Ticket>(`/tickets/${id}`),

  create: (data: Partial<Ticket>) =>
    api.post<Ticket>('/tickets', data),
};

// ─── Metrics API (F5.1) ───────────────────────────────────

export interface StatusCount {
  status: string;
  count: number;
}

export interface PriorityCount {
  priority: string;
  count: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface SLAStats {
  total_active: number;
  on_time: number;
  breached: number;
  met: number;
  not_met: number;
  breach_rate: number;
}

export interface RecentActivity {
  last_24h_created: number;
  last_24h_resolved: number;
  last_24h_breached: number;
}

export interface OutboxHealth {
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  oldest_pending_age_sec: number | null;
}

export interface TopAssignee {
  user_id: string;
  username: string | null;
  full_name: string | null;
  active_tickets: number;
  resolved_tickets: number;
}

export interface MetricsResponse {
  generated_at: string;
  window_days: number;
  total_tickets: number;
  by_status: StatusCount[];
  by_priority: PriorityCount[];
  by_category: CategoryCount[];
  sla: SLAStats;
  activity: RecentActivity;
  outbox: OutboxHealth;
  top_assignees: TopAssignee[];
}

export const metricsApi = {
  get: (params?: { window_days?: number }) =>
    api.get<MetricsResponse>('/admin/metrics', { params }),
};
