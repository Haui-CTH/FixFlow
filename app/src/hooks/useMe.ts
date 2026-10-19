// SPDX-License-Identifier: Apache-2.0
// Thông tin định danh phía BE (user_id, technician_id) để biết ticket nào là "của tôi".

import { useQuery } from '@tanstack/react-query';
import { userApi } from '../lib/api';

export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: userApi.me, staleTime: Infinity, retry: 1 });
