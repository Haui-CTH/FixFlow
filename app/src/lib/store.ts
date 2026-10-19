// SPDX-License-Identifier: Apache-2.0
// DX-FSM Global Store
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: { username: string; role: string; email: string } | null;
  token: string | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}

// Token lives in keycloak-js memory; the store only mirrors it for the UI.
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  setAuth: (token, user) => set({ isAuthenticated: true, user, token }),
  logout: () => set({ isAuthenticated: false, user: null, token: null }),
}));
