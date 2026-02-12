import { create } from 'zustand';
import * as authApi from '@/api/auth';
import { extractUser } from '@/lib/jwt';
import type { AuthUser, LoginRequest, RegisterRequest } from '@/lib/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoading: false,

  setTokens: (accessToken, refreshToken) => {
    const user = extractUser(accessToken);
    set({ accessToken, refreshToken, user });
  },

  login: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(data);
      get().setTokens(res.accessToken, res.refreshToken);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(data);
      get().setTokens(res.accessToken, res.refreshToken);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({ accessToken: null, refreshToken: null, user: null });
  },

  refresh: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return false;
    try {
      const res = await authApi.refresh(refreshToken);
      get().setTokens(res.accessToken, res.refreshToken);
      return true;
    } catch {
      get().logout();
      return false;
    }
  },

  isAuthenticated: () => get().accessToken !== null,
}));
