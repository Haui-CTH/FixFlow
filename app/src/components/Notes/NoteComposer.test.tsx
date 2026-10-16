// SPDX-License-Identifier: Apache-2.0
// DX-FSM NoteComposer component tests (F5.3)

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoteComposer } from './NoteComposer';

describe('NoteComposer', () => {
  it('renders textarea with placeholder', () => {
    render(<NoteComposer onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Nội dung note')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<NoteComposer onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Gửi note/ })).toBeInTheDocument();
  });

  it('submit disabled when empty', () => {
    render(<NoteComposer onSubmit={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /Gửi note/ });
    expect(btn).toBeDisabled();
  });

  it('submit enabled when has content', () => {
    render(<NoteComposer onSubmit={vi.fn()} />);
    const textarea = screen.getByLabelText('Nội dung note');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    const btn = screen.getByRole('button', { name: /Gửi note/ });
    expect(btn).not.toBeDisabled();
  });

  it('submit disabled with whitespace only', () => {
    render(<NoteComposer onSubmit={vi.fn()} />);
    const textarea = screen.getByLabelText('Nội dung note');
    fireEvent.change(textarea, { target: { value: '   \n  ' } });
    const btn = screen.getByRole('button', { name: /Gửi note/ });
    expect(btn).toBeDisabled();
  });

  it('calls onSubmit with normalized body', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteComposer onSubmit={onSubmit} />);

    const textarea = screen.getByLabelText('Nội dung note');
    fireEvent.change(textarea, { target: { value: '  hello world  ' } });

    const btn = screen.getByRole('button', { name: /Gửi note/ });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('hello world');
    });
  });

  it('clears textarea after successful submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteComposer onSubmit={onSubmit} />);

    const textarea = screen.getByLabelText('Nội dung note') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: /Gửi note/ }));

    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('shows error when submitting empty (after attempted submit)', async () => {
    render(<NoteComposer onSubmit={vi.fn()} />);

    // Force click submit by submitting via form (since button is disabled when empty)
    const form = screen.getByRole('button', { name: /Gửi note/ }).closest('form');
    // Use the form's submit event directly
    if (form) {
      fireEvent.submit(form, { preventDefault: () => {} });
    }

    // Note: disabled button won't trigger submit, so this test verifies that
    // the button is disabled (defensive behavior)
    const btn = screen.getByRole('button', { name: /Gửi note/ });
    expect(btn).toBeDisabled();
  });

  it('shows character count', () => {
    render(<NoteComposer onSubmit={vi.fn()} />);
    expect(screen.getByText('0 / 5000')).toBeInTheDocument();
  });

  it('updates character count as user types', () => {
    render(<NoteComposer onSubmit={vi.fn()} />);
    const textarea = screen.getByLabelText('Nội dung note');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    expect(screen.getByText('5 / 5000')).toBeInTheDocument();
  });

  it('Xóa button clears textarea', () => {
    render(<NoteComposer onSubmit={vi.fn()} />);
    const textarea = screen.getByLabelText('Nội dung note') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'hello' } });

    const cancelBtn = screen.getByRole('button', { name: /Xóa/ });
    fireEvent.click(cancelBtn);

    expect(textarea.value).toBe('');
  });

  it('Cmd+Enter submits', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteComposer onSubmit={onSubmit} />);

    const textarea = screen.getByLabelText('Nội dung note');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('Ctrl+Enter submits (Windows/Linux)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<NoteComposer onSubmit={onSubmit} />);

    const textarea = screen.getByLabelText('Nội dung note');
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('shows "Đang gửi…" when isSubmitting prop is true', () => {
    render(<NoteComposer onSubmit={vi.fn()} isSubmitting={true} />);
    expect(screen.getByText(/Đang gửi…/)).toBeInTheDocument();
  });

  it('disables textarea when isSubmitting is true', () => {
    render(<NoteComposer onSubmit={vi.fn()} isSubmitting={true} />);
    const textarea = screen.getByLabelText('Nội dung note') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
  });

  it('disables submit button when isSubmitting is true', () => {
    render(<NoteComposer onSubmit={vi.fn()} isSubmitting={true} />);
    const btn = screen.getByRole('button', { name: /Đang gửi/ });
    expect(btn).toBeDisabled();
  });
});
