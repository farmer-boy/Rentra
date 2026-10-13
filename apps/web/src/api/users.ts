import api from './client';
import type { User, TrustScore } from './types';

export const usersAPI = {
  getMe: async (): Promise<User> => (await api.get<User>('/users/me')).data,

  updateMe: async (data: Partial<User>): Promise<User> =>
    (await api.patch<User>('/users/me', data)).data,

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  getLandlordProfile: async () =>
    (await api.get<{ data: unknown }>('/users/me/landlord-profile')).data.data,
  createLandlordProfile: async (data: Record<string, unknown>) =>
    (await api.post<{ data: unknown }>('/users/me/landlord-profile', data)).data.data,
  updateLandlordProfile: async (data: Record<string, unknown>) =>
    (await api.patch<{ data: unknown }>('/users/me/landlord-profile', data)).data.data,

  getTrustScore: async (id: string): Promise<TrustScore> => {
    const response = await api.get(`/users/${id}/trust-score`);
    return response.data;
  },

  recalculateTrustScore: async () => (await api.post('/trust-score/recalculate')).data,
};
