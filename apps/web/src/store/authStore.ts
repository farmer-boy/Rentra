import { create } from 'zustand';
import type { User, AuthState } from '../types';
import { clearStoredSession } from '../api/client';
import { authAPI } from '../api/auth';
import { ApiError } from '../api/api-error';

const getPersistedUser = (): User | null => {
  try {
    const value = localStorage.getItem('user');
    return value ? (JSON.parse(value) as User) : null;
  } catch {
    return null;
  }
};

let initializationRequest: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('rentra:auth-expired', () => {
      clearStoredSession();
      set({ user: null, token: null, isAuthenticated: false });
    });
    window.addEventListener('rentra:token-refreshed', (event) => {
      const customEvent = event as CustomEvent<{ accessToken: string }>;
      set({ token: customEvent.detail.accessToken });
    });
  }

  return {
    user: getPersistedUser(),
    token: localStorage.getItem('accessToken'),
    isAuthenticated: !!localStorage.getItem('accessToken'),
    isInitialized: false,

    login: (user: User, token: string) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
      window.dispatchEvent(new Event('rentra:session-changed'));
    },

    updateUser: (updates) =>
      set((state) => {
        if (!state.user) return state;
        const user = { ...state.user, ...updates };
        localStorage.setItem('user', JSON.stringify(user));
        return { user };
      }),

    logout: () => {
      void authAPI.logout().catch((error: unknown) => {
        console.warn(
          'Could not revoke the remote Rentra session.',
          error instanceof ApiError ? error.message : 'The request failed.',
        );
      });
      clearStoredSession();
      set({ user: null, token: null, isAuthenticated: false });
      window.dispatchEvent(new Event('rentra:session-cleared'));
    },

    initialize: async () => {
      if (get().isInitialized) return;
      if (!initializationRequest) {
        initializationRequest = (async () => {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isInitialized: true,
            });
            return;
          }
          try {
            const user = await authAPI.getMe();
            const currentToken = localStorage.getItem('accessToken');
            localStorage.setItem('user', JSON.stringify(user));
            set({
              user,
              token: currentToken,
              isAuthenticated: true,
              isInitialized: true,
            });
          } catch (error) {
            console.warn(
              'Could not restore the Rentra session.',
              error instanceof ApiError ? error.message : 'The request failed.',
            );
            set({ isInitialized: true });
          }
        })().finally(() => {
          initializationRequest = null;
        });
      }
      await initializationRequest;
      if (!localStorage.getItem('accessToken')) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      }
    },
  };
});
