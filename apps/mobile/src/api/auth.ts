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
    const response = await api.post('/auth/register', {
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
    
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    
    if (response.data.accessToken) {
      await setToken(response.data.accessToken);
    }
    
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
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
