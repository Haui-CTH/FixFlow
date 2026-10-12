// DX-FSM Global Store
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: { username: string; role: string; email: string } | null;
  token: string | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('access_token'),
  setAuth: (token, user) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ isAuthenticated: true, user, token });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ isAuthenticated: false, user: null, token: null });
  },
}));
