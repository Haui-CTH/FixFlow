// SPDX-License-Identifier: Apache-2.0
// DX-FSM API Client
import axios from 'axios';
import { toastApi } from './toast';
import keycloak from './auth';
import { t } from './i18n';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// timeout: không để giao diện quay vô hạn khi backend không trả lời (upload ghi đè bằng timeout riêng)
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
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
        toastApi.warning(t('api.phien_dang_nhap_het_han'), t('api.vui_long_dang_nhap_lai'));
        keycloak.login({ redirectUri: window.location.href });
      }
    } else if (error.response?.status === 403) {
      toastApi.error(t('api.ban_khong_co_quyen_thuc_hien_thao'), '403 Forbidden');
    } else if (error.response?.status === 404) {
      // Skip 404 toast — components often handle 404s explicitly
    } else if (error.response?.status === 500) {
      toastApi.error(t('api.loi_may_chu_vui_long_thu_lai_sau'), '500 Server Error');
    } else if (error.response?.status >= 500) {
      toastApi.error(t('api.error_status', { status: error.response.status, text: error.response.statusText || 'Server error' }));
    } else if (!error.response) {
      // Network error
      toastApi.error(t('api.khong_ket_noi_duoc_toi_may_chu'), t('api.loi_mang'));
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
  customer_id?: string;
  customer_name?: string;
  customer_email?: string | null;
  customer_location?: string | null;
  technician_id?: string | null;
  technician_name?: string | null;
  ai_category?: string | null;
  ai_priority?: string | null;
  ai_confidence?: number | null;
  ai_recommendation?: string | null;
  created_at?: string;
  updated_at?: string | null;
  assigned_at?: string | null;
  sla_deadline?: string | null;
}

export interface TicketPatch {
  status?: string;
  technician_id?: string;
  technician_name?: string;
  description?: string;
  priority?: string;
  category?: string;
}

export interface TicketListParams {
  status?: string;
  priority?: string;
  category?: string;
  q?: string;
  mine?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_dir?: string;
}

export interface TicketListResponse {
  items: Ticket[];
  total: number;
  page_limit: number;
  page_offset: number;
}

export interface TicketCreateInput {
  title: string;
  description: string;
  category: string;
  priority: string;
  customer_location?: string;
}

export interface AiClassifyResult {
  category: string;
  priority: string;
  confidence: number;
  method: string;
  recommendation?: string | null;
  reasoning?: string | null;
}

export const ticketApi = {
  list: (params?: TicketListParams) =>
    api.get<TicketListResponse>('/tickets', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Ticket>(`/tickets/${id}`),

  update: (id: string, patch: TicketPatch) =>
    api.patch<Ticket>(`/tickets/${id}`, patch).then((r) => r.data),

  // customer_id/name/email để trống: BE lấy từ JWT
  create: (data: TicketCreateInput) =>
    api.post<Ticket>('/tickets', data).then((r) => r.data),
};

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  user_name?: string | null;
  content: string;
  is_internal: boolean;
  created_at?: string | null;
}

export const commentApi = {
  list: (ticketId: string) =>
    api.get<TicketComment[]>(`/tickets/${ticketId}/comments`).then((r) => r.data),
  post: (ticketId: string, content: string, is_internal: boolean) =>
    api.post<TicketComment>(`/tickets/${ticketId}/comments`, { content, is_internal }).then((r) => r.data),
  remove: (ticketId: string, commentId: string) =>
    api.delete(`/tickets/${ticketId}/comments/${commentId}`),
};

export interface Attachment {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  user_name?: string | null;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  url: string;
  created_at?: string | null;
}

export const attachmentApi = {
  list: (ticketId: string) =>
    api.get<Attachment[]>(`/tickets/${ticketId}/attachments`).then((r) => r.data),
  upload: (ticketId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    // instance mặc định gửi JSON; phải ghi đè để axios gửi multipart (kèm boundary)
    return api
      .post<Attachment>(`/tickets/${ticketId}/attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 })
      .then((r) => r.data);
  },
  remove: (ticketId: string, attId: string) =>
    api.delete(`/tickets/${ticketId}/attachments/${attId}`),
  // Tải qua axios (mang Authorization) rồi dùng blob URL để xem/tải
  blob: (ticketId: string, attId: string) =>
    api.get<Blob>(`/tickets/${ticketId}/attachments/${attId}/download`, { responseType: 'blob' }).then((r) => r.data),
};

export interface Technician {
  id: string;
  user_id: string;
  full_name: string;
  employee_code?: string | null;
  specialty: string[];
  current_load: number;
  max_concurrent_tickets: number;
  is_available: boolean;
}

export interface Me {
  user_id: string | null;
  technician_id: string | null;
  username: string;
  role: string | null;
}

export const userApi = {
  me: () => api.get<Me>('/users/me').then((r) => r.data),
  technicians: () => api.get<Technician[]>('/users/technicians').then((r) => r.data),
};

export interface AiTechnicianRec {
  technician_id: string;
  technician_name: string;
  employee_code: string;
  specialty: string[];
  level: number;
  score: number;
  confidence: number;
  reasons: string[];
  current_workload: number;
  estimated_pickup_hours: number;
}

export interface AiRecommendResponse {
  ticket_id: string;
  recommendations: AiTechnicianRec[];
  total_technicians: number;
}

export const aiApi = {
  // AI service trả confidence theo thang 0–100 (hoặc 0–1); chuẩn hoá về 0–1
  classify: (title: string, description: string) =>
    api.post<AiClassifyResult>('/classify', { title, description }).then((r) => ({
      ...r.data,
      confidence: r.data.confidence > 1 ? r.data.confidence / 100 : r.data.confidence,
    })),

  recommend: (data: {
    ticket_id: string;
    title: string;
    description?: string;
    category: string;
    priority: string;
  }) =>
    api
      .post<AiRecommendResponse>('/recommend', data)
      .then((r) => r.data.recommendations)
      .catch(() => [] as AiTechnicianRec[]),
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
