// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KbSuggestions } from './KbSuggestions';
import { aiApi } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  aiApi: {
    searchKb: vi.fn(),
    getKbArticle: vi.fn(),
  },
  categoryMeta: (c: string) => ({ label: c, tone: 'info' }),
}));

const mockHits = [
  {
    id: 'kb-001',
    title: 'Khắc phục máy in HP không hoạt động',
    category: 'hardware',
    score: 0.88,
    matched_terms: ['máy', 'in'],
    snippet: 'Kiểm tra cáp nguồn và khay giấy của máy in.',
  },
  {
    id: 'kb-002',
    title: 'Hướng dẫn cài đặt driver máy in',
    category: 'software',
    score: 0.75,
    matched_terms: ['máy', 'in', 'driver'],
    snippet: 'Tải driver từ website hỗ trợ chính hãng.',
  },
];

function setup(props: { query: string; category?: string; onInsert?: (t: string) => void }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <KbSuggestions {...props} />
    </QueryClientProvider>
  );
}

describe('KbSuggestions component (P5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when query is less than 3 characters', () => {
    const { container } = setup({ query: 'in' });
    expect(container.firstChild).toBeNull();
  });

  it('renders matching KB articles when query has enough characters', async () => {
    vi.mocked(aiApi.searchKb).mockResolvedValueOnce(mockHits);

    setup({ query: 'máy in' });

    await waitFor(() => {
      expect(screen.getByText('Khắc phục máy in HP không hoạt động')).toBeInTheDocument();
      expect(screen.getByText('Hướng dẫn cài đặt driver máy in')).toBeInTheDocument();
    });

    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('calls onInsert callback when user clicks insert button', async () => {
    vi.mocked(aiApi.searchKb).mockResolvedValueOnce(mockHits);
    const onInsert = vi.fn();

    setup({ query: 'máy in', onInsert });

    await waitFor(() => {
      expect(screen.getByText('Khắc phục máy in HP không hoạt động')).toBeInTheDocument();
    });

    const insertBtns = screen.getAllByText('Chèn vào mô tả');
    fireEvent.click(insertBtns[0]);

    expect(onInsert).toHaveBeenCalledWith(
      expect.stringContaining('Khắc phục máy in HP không hoạt động')
    );
  });
});

