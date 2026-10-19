// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination, pageList } from './Pagination';

describe('pageList', () => {
  it('collapses gaps', () => {
    expect(pageList(1, 3)).toEqual([1, 2, 3]);
    expect(pageList(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
  });
});

describe('Pagination', () => {
  it('shows range, marks current page, and navigates', () => {
    const onPage = vi.fn();
    render(<Pagination page={2} size={20} total={45} onPage={onPage} onSize={vi.fn()} />);
    expect(screen.getByText('Hiển thị 21–40 / 45')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(onPage).toHaveBeenCalledWith(3);
  });
  it('disables prev on first page and next on last', () => {
    const { rerender } = render(<Pagination page={1} size={20} total={45} onPage={vi.fn()} onSize={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
    rerender(<Pagination page={3} size={20} total={45} onPage={vi.fn()} onSize={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled();
  });
  it('changes page size', () => {
    const onSize = vi.fn();
    render(<Pagination page={1} size={20} total={45} onPage={vi.fn()} onSize={onSize} />);
    fireEvent.change(screen.getByLabelText('Mỗi trang'), { target: { value: '50' } });
    expect(onSize).toHaveBeenCalledWith(50);
  });
});
