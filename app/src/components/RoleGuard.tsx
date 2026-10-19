// SPDX-License-Identifier: Apache-2.0
// RoleGuard (A2.9): thiếu quyền -> chuyển về /tickets.

import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import type { Role } from '../lib/auth';

export function RoleGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const role = useRole();
  if (!role || !roles.includes(role)) return <Navigate to="/tickets" replace />;
  return <>{children}</>;
}
