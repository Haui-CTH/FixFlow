// SPDX-License-Identifier: Apache-2.0
// DX-FSM NoteItem component tests (F5.3)

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteItem } from './NoteItem';
import type { Note } from '../../lib/notes';

const baseNote: Note = {
  id: 'n1',
  ticket_id: 't1',
  author_id: 'u1',
  author_name: 'Alice Nguyen',
  body: 'Test note body',
  created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
  updated_at: new Date(Date.now() - 5 * 60_000).toISOString(),
};

describe('NoteItem', () => {
  it('renders author name', () => {
    render(<NoteItem note={baseNote} />);
    expect(screen.getByText('Alice Nguyen')).toBeInTheDocument();
  });

  it('renders body', () => {
    render(<NoteItem note={baseNote} />);
    expect(screen.getByText('Test note body')).toBeInTheDocument();
  });

  it('renders initials in avatar', () => {
    const { container } = render(<NoteItem note={baseNote} />);
    expect(container.textContent).toContain('AN'); // Alice Nguyen
  });

  it('handles single-word name', () => {
    const note = { ...baseNote, author_name: 'Alice' };
    const { container } = render(<NoteItem note={note} />);
    expect(container.textContent).toContain('AL');
  });

  it('handles missing name (fallback to id)', () => {
    const note = { ...baseNote, author_name: null, author_id: 'abcdef123456' };
    render(<NoteItem note={note} />);
    expect(screen.getByText('abcdef12')).toBeInTheDocument();
  });

  it('preserves line breaks in body', () => {
    const note = { ...baseNote, body: 'line 1\nline 2\nline 3' };
    const { container } = render(<NoteItem note={note} />);
    const body = container.querySelector('p');
    expect(body?.textContent).toBe('line 1\nline 2\nline 3');
  });

  it('renders relative time', () => {
    render(<NoteItem note={baseNote} />);
    expect(screen.getByText(/5m trước/)).toBeInTheDocument();
  });
});
