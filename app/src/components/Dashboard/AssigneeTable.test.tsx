// SPDX-License-Identifier: Apache-2.0
// DX-FSM Dashboard – AssigneeTable component tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssigneeTable } from './AssigneeTable';
import type { TopAssignee } from '../../lib/api';

const assignees: TopAssignee[] = [
  {
    user_id: 'u1',
    username: 'alice',
    full_name: 'Alice Nguyen',
    active_tickets: 5,
    resolved_tickets: 20,
  },
  {
    user_id: 'u2',
    username: 'bob',
    full_name: 'Bob Tran',
    active_tickets: 3,
    resolved_tickets: 15,
  },
];

describe('AssigneeTable', () => {
  it('renders section title', () => {
    render(<AssigneeTable assignees={assignees} />);
    expect(screen.getByText(/Top Assignees/)).toBeInTheDocument();
  });

  it('renders technician names', () => {
    render(<AssigneeTable assignees={assignees} />);
    expect(screen.getByText('Alice Nguyen')).toBeInTheDocument();
    expect(screen.getByText('Bob Tran')).toBeInTheDocument();
  });

  it('renders usernames with @ prefix', () => {
    render(<AssigneeTable assignees={assignees} />);
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
  });

  it('renders active counts', () => {
    render(<AssigneeTable assignees={assignees} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders resolved counts', () => {
    render(<AssigneeTable assignees={assignees} />);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders total (active + resolved)', () => {
    render(<AssigneeTable assignees={assignees} />);
    // Alice: 5+20=25, Bob: 3+15=18
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('shows empty state when no assignees', () => {
    render(<AssigneeTable assignees={[]} />);
    expect(screen.getByText('No assignees yet')).toBeInTheDocument();
  });

  it('falls back to username when no full_name', () => {
    const partial: TopAssignee[] = [
      {
        user_id: 'u3',
        username: 'charlie',
        full_name: null,
        active_tickets: 1,
        resolved_tickets: 0,
      },
    ];
    render(<AssigneeTable assignees={partial} />);
    expect(screen.getByText('charlie')).toBeInTheDocument();
  });
});
