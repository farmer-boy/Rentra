import { api } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';
import { Platform } from 'react-native';

let SecureStore: any = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('SecureStore not available');
  }
}

const normalizeUser = (user: User): User => {
  const roles = user.roles ?? [user.role ?? 'TENANT'];
  return {
    ...user,
    roles,
    role: user.role ?? roles[0] ?? 'TENANT',
  };
};

const setToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('accessToken', token);
    } else if (SecureStore) {
      await SecureStore.setItemAsync('accessToken', token);
    }
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

export const authAPI = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      fullName: data.username, // Backend expects fullName, mobile has username
      email: data.email,
      phone: data.phone,
      cnic: data.cnic,
      password: data.password,
      role: data.role,
    });
    
    if (response.data.accessToken) {
      await setToken(response.data.accessToken);
    }
    
    return { ...response.data, user: normalizeUser(response.data.user) };
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    
    if (response.data.accessToken) {
      await setToken(response.data.accessToken);
    }
    
    return { ...response.data, user: normalizeUser(response.data.user) };
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return normalizeUser(response.data);
  },

  logout: async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } else if (SecureStore) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('user');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('accessToken');
      }
      return SecureStore ? await SecureStore.getItemAsync('accessToken') : null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  setToken: setToken,
};
