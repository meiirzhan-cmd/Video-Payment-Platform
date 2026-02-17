import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '@/api/auth';
import { extractUser, getTokenTiming, isTokenExpired } from '@/lib/jwt';
import type { AuthUser, LoginRequest, RegisterRequest } from '@/lib/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  _hasHydrated: boolean;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  isAuthenticated: () => boolean;
}

// ── Proactive token refresh ─────────────────────────────────
// Schedules a refresh at 80% of the access token's lifetime so
// the token never expires during playback or any other activity.

let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

/** Singleton refresh promise — prevents concurrent refresh calls. */
let activeRefreshPromise: Promise<boolean> | null = null;

function clearRefreshTimer() {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
}

function scheduleProactiveRefresh(accessToken: string) {
  clearRefreshTimer();

  const timing = getTokenTiming(accessToken);
  if (!timing) return;

  const lifetime = timing.expiresAt - timing.issuedAt;
  // Refresh at 80% of the token's lifetime (e.g. 12 min for a 15-min token)
  const refreshAt = timing.issuedAt + lifetime * 0.8;
  const delay = refreshAt - Date.now();

  if (delay <= 0) {
    // Token is already past 80% of its lifetime — refresh now
    useAuthStore.getState().refresh();
    return;
  }

  refreshTimerId = setTimeout(() => {
    refreshTimerId = null;
    useAuthStore.getState().refresh();
  }, delay);
}

// ── Store ────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoading: false,
      _hasHydrated: false,

      setTokens: (accessToken, refreshToken) => {
        const user = extractUser(accessToken);
        set({ accessToken, refreshToken, user });
        scheduleProactiveRefresh(accessToken);
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
        clearRefreshTimer();
        set({ accessToken: null, refreshToken: null, user: null });
      },

      refresh: async () => {
        // Deduplicate: if a refresh is already in-flight, reuse it
        if (activeRefreshPromise) return activeRefreshPromise;

        const { refreshToken } = get();
        if (!refreshToken) return false;

        activeRefreshPromise = (async () => {
          try {
            const res = await authApi.refresh(refreshToken);
            get().setTokens(res.accessToken, res.refreshToken);
            return true;
          } catch {
            get().logout();
            return false;
          } finally {
            activeRefreshPromise = null;
          }
        })();

        return activeRefreshPromise;
      },

      isAuthenticated: () => {
        const token = get().accessToken;
        return token !== null && !isTokenExpired(token);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);

// ── Hydration ────────────────────────────────────────────────

function onHydrated() {
  useAuthStore.setState({ _hasHydrated: true });
  const { accessToken } = useAuthStore.getState();
  if (accessToken && !isTokenExpired(accessToken)) {
    scheduleProactiveRefresh(accessToken);
  } else if (accessToken) {
    // Persisted token already expired — try to refresh immediately
    useAuthStore.getState().refresh();
  }
}

if (useAuthStore.persist.hasHydrated()) {
  onHydrated();
}
useAuthStore.persist.onFinishHydration(onHydrated);
