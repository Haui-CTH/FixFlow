// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Button } from './Button';
import { StatusBadge, PriorityBadge } from './Badge';
import { Input } from './Field';
import { Modal } from './Modal';
import { EmptyState, ErrorState } from './States';
import { PageHeader } from './Card';

describe('ui primitives', () => {
  it('Button loading disables and blocks clicks', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Gửi</Button>);
    const b = screen.getByRole('button', { name: 'Gửi' });
    expect(b).toBeDisabled();
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
  });
  it('icon-only Button exposes aria-label', () => {
    render(<Button iconOnly aria-label="Xoá">x</Button>);
    expect(screen.getByRole('button', { name: 'Xoá' })).toBeInTheDocument();
  });
  it('Badges show text label, not only color', () => {
    render(<><StatusBadge status="new" /><PriorityBadge priority="urgent" /></>);
    expect(screen.getByText('Mới')).toBeInTheDocument();
    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument();
  });
  it('Field links label, helper and error', () => {
    render(<Input label="Tiêu đề" helper="Tối đa 100" error="Bắt buộc" />);
    const input = screen.getByLabelText('Tiêu đề');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Bắt buộc');
  });
  it('Modal: Esc closes, restores focus, traps Tab', () => {
    const onClose = vi.fn();
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<Modal open title="Hộp thoại" onClose={onClose}><button>OK</button></Modal>);
    expect(screen.getByRole('dialog', { name: 'Hộp thoại' })).toBeInTheDocument();
    const buttons = within(screen.getByRole('dialog')).getAllByRole('button');
    buttons[buttons.length - 1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[0]);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    unmount();
    expect(document.activeElement).toBe(opener);
  });
  it('ErrorState is an alert with retry', () => {
    const retry = vi.fn();
    render(<ErrorState message="Mất kết nối" onRetry={retry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(retry).toHaveBeenCalled();
  });
  it('EmptyState and PageHeader render', () => {
    render(<><PageHeader title="Tickets" description="Danh sách" /><EmptyState title="Trống" /></>);
    expect(screen.getByRole('heading', { level: 1, name: 'Tickets' })).toBeInTheDocument();
    expect(screen.getByText('Trống')).toBeInTheDocument();
  });
});
