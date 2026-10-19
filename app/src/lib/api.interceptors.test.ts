// SPDX-License-Identifier: Apache-2.0
// V10.9: lỗi 401/403/404/500/mạng được báo đúng, không treo.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const h = vi.hoisted(() => ({
  toast: { error: vi.fn(), warning: vi.fn(), info: vi.fn(), success: vi.fn() },
  kc: { authenticated: true, token: 'tok', updateToken: vi.fn().mockResolvedValue(true), login: vi.fn() },
}));
vi.mock('./toast', () => ({ toastApi: h.toast }));
vi.mock('./auth', () => ({ default: h.kc }));

import { api } from './api';

// adapter giả: trả lỗi HTTP (status) hoặc lỗi mạng (không có response)
const failWith = (status?: number) => {
  api.defaults.adapter = async (cfg: InternalAxiosRequestConfig) => {
    const err = new Error('boom') as AxiosError;
    err.isAxiosError = true;
    err.config = cfg;
    if (status) err.response = { status, statusText: 'X', data: {}, headers: {}, config: cfg };
    throw err;
  };
};

beforeEach(() => {
  Object.values(h.toast).forEach((f) => f.mockReset());
  h.kc.login.mockReset();
});

describe('api interceptors', () => {
  it('attaches the Bearer token from keycloak', async () => {
    let seen = '';
    api.defaults.adapter = async (cfg) => {
      seen = String(cfg.headers.get('Authorization'));
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config: cfg };
    };
    await api.get('/x');
    expect(seen).toBe('Bearer tok');
  });

  it('403 shows a clear permission toast and rejects', async () => {
    failWith(403);
    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(h.toast.error).toHaveBeenCalledWith(expect.stringContaining('không có quyền'), '403 Forbidden');
  });

  it('500 shows a server-error toast', async () => {
    failWith(500);
    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(h.toast.error).toHaveBeenCalledWith(expect.stringContaining('Lỗi máy chủ'), '500 Server Error');
  });

  it('502 (gateway down) shows an error toast with the status', async () => {
    failWith(502);
    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(h.toast.error).toHaveBeenCalledWith(expect.stringContaining('502'));
  });

  it('network error (no response) shows a connection toast', async () => {
    failWith();
    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(h.toast.error).toHaveBeenCalledWith(expect.stringContaining('Không kết nối'), 'Lỗi mạng');
  });

  it('404 stays silent (pages handle it themselves)', async () => {
    failWith(404);
    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(h.toast.error).not.toHaveBeenCalled();
  });

  it('401 warns and sends the user back through Keycloak login', async () => {
    failWith(401);
    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(h.toast.warning).toHaveBeenCalled();
    expect(h.kc.login).toHaveBeenCalledTimes(1);
  });
});
