// SPDX-License-Identifier: Apache-2.0
import { useAuthStore } from '../lib/store';
import type { Role } from '../lib/auth';

export const useRole = (): Role | null => useAuthStore((s) => (s.user?.role as Role | undefined) ?? null);
