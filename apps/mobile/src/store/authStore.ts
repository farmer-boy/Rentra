import { create } from 'zustand';
import { Platform } from 'react-native';
import type { User, AuthState } from '../types';

let SecureStore: any = null;

// Only import SecureStore on native platforms
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('SecureStore not available');
  }
}

interface AuthStoreState extends AuthState {
  isLoading: boolean;
  initializeAuth: () => Promise<void>;
}

const getItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore ? await SecureStore.getItemAsync(key) : null;
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
};

const setItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else if (SecureStore) {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
  }
};

const removeItem = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else if (SecureStore) {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
  }
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initializeAuth: async () => {
    try {
      const token = await getItem('accessToken');
      const userStr = await getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (parseError) {
          console.error('Error parsing user:', parseError);
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  login: async (user: User, token: string) => {
    try {
      await setItem('accessToken', token);
      await setItem('user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await removeItem('accessToken');
      await removeItem('user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },
}));
