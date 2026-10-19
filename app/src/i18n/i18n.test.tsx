// SPDX-License-Identifier: Apache-2.0
// I9.2, I9.8: vi/en cùng bộ khoá; đổi ngôn ngữ; fallback; không lọt chuỗi tiếng Việt khi ở EN.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import i18n, { setLang, t, currentLang } from '../lib/i18n';
import vi_ from './vi.json';
import en_ from './en.json';

type Tree = { [k: string]: string | Tree };
const flat = (n: Tree, p = ''): Record<string, string> =>
  Object.entries(n).reduce<Record<string, string>>(
    (acc, [k, v]) => (typeof v === 'string' ? { ...acc, [p + k]: v } : { ...acc, ...flat(v, p + k + '.') }),
    {},
  );
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const vars = (s: string) => (s.match(/{{\s*\w+\s*}}/g) ?? []).sort().join(',');

afterEach(async () => {
  await setLang('vi');
});

describe('translation files', () => {
  const vi = flat(vi_ as Tree);
  const en = flat(en_ as Tree);

  it('vi and en have exactly the same keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
  });
  it('no empty values and the same {{placeholders}} in both languages', () => {
    for (const k of Object.keys(vi)) {
      expect(en[k], k).toBeTruthy();
      expect(vars(en[k]), `placeholders of ${k}`).toBe(vars(vi[k]));
    }
  });
  it('English values contain no Vietnamese diacritics (except intentional ones)', () => {
    const leaks = Object.entries(en).filter(([, v]) => VI.test(v)).map(([k]) => k);
    expect(leaks).toEqual([]);
  });
});

describe('switching language', () => {
  it('defaults to vi and updates t(), html lang and meta labels immediately', async () => {
    expect(currentLang()).toBe('vi');
    expect(t('status.in_progress')).toBe('Đang xử lý');
    await setLang('en');
    expect(currentLang()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(t('status.in_progress')).toBe('In progress');
  });

  it('falls back to vi when a key is missing in en', async () => {
    i18n.addResource('vi', 'translation', 'test_only.key', 'chỉ có tiếng Việt');
    await setLang('en');
    expect(t('test_only.key')).toBe('chỉ có tiếng Việt');
  });

  it('persists the choice in localStorage and survives blocked storage', async () => {
    await setLang('en');
    expect(localStorage.getItem('dxfsm-lang')).toBe('en');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    await expect(setLang('vi')).resolves.toBeDefined();
    vi.restoreAllMocks();
  });
});

describe('no Vietnamese leaks into the English UI', () => {
  it('lib helpers: meta labels, nav, actions, sla, history, dates', async () => {
    await setLang('en');
    const { STATUS_META, PRIORITY_META, CATEGORY_META } = await import('../lib/ticket-meta');
    const { NAV_ITEMS, pageTitle } = await import('../lib/nav');
    const { actionsFor } = await import('../lib/ticket-transitions');
    const { slaInfo } = await import('../lib/sla');
    const { describeEvent } = await import('../lib/history');
    const { formatRelative, formatDate } = await import('../lib/format');
    const texts: string[] = [
      ...Object.values(STATUS_META).map((m) => m.label),
      ...Object.values(PRIORITY_META).map((m) => m.label),
      ...Object.values(CATEGORY_META).map((m) => m.label),
      ...NAV_ITEMS.map((n) => n.label),
      ...['/', '/tickets', '/my-tickets', '/tickets/new', '/tickets/x', '/notifications', '/zzz'].map(pageTitle),
      ...(['manager', 'technician', 'customer'] as const).flatMap((role) =>
        ['new', 'assigned', 'in_progress', 'pending', 'resolved'].flatMap((status) =>
          actionsFor({ role, status, isMine: true, isOwner: true }).flatMap((a) => [a.label, a.confirm ?? '']),
        ),
      ),
      slaInfo('2026-01-02T12:00:00Z', 'new', '2026-01-01T00:00:00Z', Date.parse('2026-01-02T10:00:00Z'))!.text,
      slaInfo('2026-01-02T12:00:00Z', 'new', '2026-01-01T00:00:00Z', Date.parse('2026-01-02T15:00:00Z'))!.text,
      describeEvent({ id: '1', ticket_id: 't', action: 'status_changed', old_value: 'a', new_value: 'b', created_at: '' } as never),
      formatRelative(Date.now() - 5000),
      formatDate('2026-01-02T00:00:00Z'),
    ];
    expect(texts.filter((s) => VI.test(s))).toEqual([]);
    expect(texts.find((s) => s.includes('left'))).toBeTruthy();
  });

  it('components: pagination, filters, error summary, dropzone', async () => {
    await setLang('en');
    const { Pagination } = await import('../components/ui/Pagination');
    const { TicketFilters } = await import('../components/Tickets/TicketFilters');
    const { ErrorSummary } = await import('../components/ui/ErrorSummary');
    const { FileDropzone } = await import('../components/ui/FileDropzone');
    render(
      <MemoryRouter>
        <Pagination page={2} size={20} total={45} onPage={() => {}} onSize={() => {}} />
        <TicketFilters
          filters={{ q: 'wifi', status: 'new', priority: 'critical', category: 'network' }}
          sort="priority:desc"
          onChange={() => {}}
          onSort={() => {}}
          onClear={() => {}}
        />
        <ErrorSummary errors={[{ name: 'title', message: 'x' }]} />
        <FileDropzone files={[]} onChange={() => {}} />
      </MemoryRouter>,
    );
    expect(document.body.textContent ?? '').not.toMatch(VI);
    // thuộc tính aria-label cũng không được lọt tiếng Việt
    const labels = [...document.querySelectorAll('[aria-label],[placeholder],[title]')].map(
      (e) => `${e.getAttribute('aria-label')} ${e.getAttribute('placeholder')} ${e.getAttribute('title')}`,
    );
    expect(labels.filter((s) => VI.test(s))).toEqual([]);
    expect(screen.getByText('Showing 21–40 of 45')).toBeInTheDocument();
  });

  it('page: tickets list in English', async () => {
    await setLang('en');
    vi.doMock('../lib/api', () => ({
      ticketApi: {
        list: () =>
          Promise.resolve({
            items: [{ id: '1', ticket_number: 'T-1', title: 'WiFi down', status: 'in_progress', priority: 'critical', category: 'network', technician_name: null, created_at: '2026-01-01T00:00:00Z', sla_deadline: null }],
            total: 1, page_limit: 20, page_offset: 0,
          }),
      },
    }));
    vi.doMock('../hooks/useRole', () => ({ useRole: () => 'manager' }));
    const { default: Tickets } = await import('../pages/Tickets');
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <Tickets />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: /All tickets/ })).toBeInTheDocument();
    expect((await screen.findAllByText('In progress')).length).toBeGreaterThan(0);
    expect(document.body.textContent ?? '').not.toMatch(VI);
    vi.doUnmock('../lib/api');
    vi.doUnmock('../hooks/useRole');
  });
});
