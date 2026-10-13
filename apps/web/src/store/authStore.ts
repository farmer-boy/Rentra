import { create } from 'zustand';
import type { User, AuthState } from '../types';
import { clearStoredSession } from '../api/client';
import { authAPI } from '../api/auth';

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
    },

    updateUser: (updates) =>
      set((state) => {
        if (!state.user) return state;
        const user = { ...state.user, ...updates };
        localStorage.setItem('user', JSON.stringify(user));
        return { user };
      }),

    logout: () => {
      void authAPI.logout().catch(() => undefined);
      clearStoredSession();
      set({ user: null, token: null, isAuthenticated: false });
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
            localStorage.setItem('user', JSON.stringify(user));
            set({
              user,
              token,
              isAuthenticated: true,
              isInitialized: true,
            });
          } catch (error) {
            console.error('Could not restore the Rentra session.', error);
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
