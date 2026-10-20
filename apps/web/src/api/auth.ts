import api, { getRefreshToken, setRefreshToken } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from './types';

export const authAPI = {
  register: async (data: RegisterRequest): Promise<{ message: string; email: string }> => {
    const response = await api.post<{ message: string; email: string }>('/auth/register', {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      cnic: data.cnic || undefined,
    });
    return response.data;
  },

  verifyRegistration: async (email: string, code: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register/verify', { email, code });
    if (response.data.refreshToken) setRefreshToken(response.data.refreshToken);
    if (response.data.accessToken) localStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  },

  resendRegistrationCode: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/register/resend-code', { email });
    return response.data;
  },

  login: async (data: LoginRequest): Promise<{ message: string; email: string; loginVerificationRequired: true }> => {
    const response = await api.post<{ message: string; email: string; loginVerificationRequired: true }>('/auth/login', data);
    return response.data;
  },

  loginWithGoogle: async (credential: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google/login', { credential });
    if (response.data.refreshToken) setRefreshToken(response.data.refreshToken);
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data;
  },

  verifyLoginCode: async (email: string, code: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login/verify', { email, code });
    if (response.data.refreshToken) setRefreshToken(response.data.refreshToken);
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  resetPassword: async (
    token: string,
    password: string,
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.get<{ message: string }>('/auth/verify-email', {
      params: { token },
    });
    return response.data;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setRefreshToken(null);
    }
  },
};
