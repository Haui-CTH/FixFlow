// DX-FSM API Client
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9180/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
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
  list: (params?: { status?: string; priority?: string; category?: string }) =>
    api.get<Ticket[]>('/tickets', { params }),

  get: (id: string) =>
    api.get<Ticket>(`/tickets/${id}`),

  create: (data: Partial<Ticket>) =>
    api.post<Ticket>('/tickets', data),
};
