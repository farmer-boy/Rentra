import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, toApiError } from './api-error';

const apiBaseURL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000/api';
const timeout = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;
let refreshTokenInMemory: string | null = null;
let refreshRequest: Promise<string> | null = null;

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

export const setRefreshToken = (token: string | null) => {
  refreshTokenInMemory = token;
  if (typeof sessionStorage !== 'undefined') {
    if (token) sessionStorage.setItem('refreshToken', token);
    else sessionStorage.removeItem('refreshToken');
  }
};

export const getRefreshToken = () => {
  if (refreshTokenInMemory) return refreshTokenInMemory;
  if (typeof sessionStorage === 'undefined') return null;
  refreshTokenInMemory = sessionStorage.getItem('refreshToken');
  return refreshTokenInMemory;
};

export const clearStoredSession = () => {
  setRefreshToken(null);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
};

const api = axios.create({
  baseURL: apiBaseURL,
  timeout,
  headers: { 'Content-Type': 'application/json' },
});

const isAuthEndpoint = (url = '') =>
  /\/auth\/(?:login(?:\/verify)?|google\/login|register(?:\/(?:verify|resend-code))?|refresh|logout|forgot-password|reset-password|verify-email)(?:$|\?)/.test(url);

api.interceptors.request.use((config) => {
  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.set('Content-Type', false);
  }
  return config;
});

const refreshAccessToken = async () => {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    throw new ApiError({
      status: 401,
      message: 'Your session has expired. Please sign in again.',
    });
  }
  if (!refreshRequest) {
    refreshRequest = axios
      .post(
        `${apiBaseURL.replace(/\/$/, '')}/auth/refresh`,
        { refreshToken: currentRefreshToken },
        { timeout },
      )
      .then((response) => {
        const { accessToken, refreshToken } = response.data as {
          accessToken: string;
          refreshToken: string;
        };
        if (!accessToken || !refreshToken) {
          throw new ApiError({
            status: 502,
            message: 'The authentication server returned an invalid token response.',
          });
        }
        setRefreshToken(refreshToken);
        localStorage.setItem('accessToken', accessToken);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('rentra:token-refreshed', {
              detail: { accessToken },
            }),
          );
        }
        return accessToken;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
};

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }
    const request = error.config as RetryableRequest | undefined;
    if (
      error.response?.status === 401 &&
      request &&
      !request._retry &&
      !isAuthEndpoint(request.url)
    ) {
      request._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        request.headers.Authorization = `Bearer ${accessToken}`;
        return await api(request);
      } catch (refreshError) {
        clearStoredSession();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('rentra:auth-expired'));
          if (window.location.pathname !== '/login') {
            window.location.assign('/login');
          }
        }
        return Promise.reject(toApiError(refreshError));
      }
    }
    return Promise.reject(toApiError(error as AxiosError));
  },
);

export default api;
