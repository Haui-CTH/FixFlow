// SPDX-License-Identifier: Apache-2.0
// RoleGuard (A2.9): thiếu quyền -> chuyển về trang chủ của role.

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import type { Role } from '../lib/auth';
import { homeFor } from '../lib/nav';
import { toastApi } from '../lib/toast';

export function RoleGuard({ roles, children, deniedMessage }: { roles: Role[]; children: React.ReactNode; deniedMessage?: string }) {
  const role = useRole();
  const denied = !role || !roles.includes(role);
  useEffect(() => {
    if (denied && deniedMessage) toastApi.warning(deniedMessage);
  }, [denied, deniedMessage]);
  if (denied) return <Navigate to={homeFor(role)} replace />;
  return <>{children}</>;
}
