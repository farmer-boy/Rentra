import api from './client';
import type { User, TrustScore } from './types';

export const usersAPI = {
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  getProfile: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}/profile`);
    return response.data;
  },

  getTrustScore: async (id: string): Promise<TrustScore> => {
    const response = await api.get(`/users/${id}/trust-score`);
    return response.data;
  },

  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}/profile`, data);
    return response.data;
  },
};
