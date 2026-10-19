// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { api, attachmentApi } from './api';

describe('attachmentApi.upload', () => {
  it('sends multipart/form-data (not the JSON default) with the file', async () => {
    let seen: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (cfg) => {
      seen = cfg;
      return { data: {}, status: 201, statusText: 'Created', headers: {}, config: cfg };
    };
    await attachmentApi.upload('t1', new File(['x'], 'a.png', { type: 'image/png' }));
    expect(String(seen?.headers.get('Content-Type'))).toContain('multipart/form-data');
    expect(seen?.data).toBeInstanceOf(FormData);
  });
});
