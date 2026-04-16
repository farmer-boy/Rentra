import api from './client';
import type { Dispute, CreateDisputeRequest, PaginatedResponse } from './types';

export const disputesAPI = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Dispute>> => {
    const response = await api.get('/disputes', { params: { page, limit } });
    return response.data;
  },

  getOne: async (id: string): Promise<Dispute> => {
    const response = await api.get(`/disputes/${id}`);
    return response.data;
  },

  create: async (data: CreateDisputeRequest): Promise<Dispute> => {
    const response = await api.post('/disputes', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateDisputeRequest>): Promise<Dispute> => {
    const response = await api.patch(`/disputes/${id}`, data);
    return response.data;
  },

  addMessage: async (id: string, message: string): Promise<Dispute> => {
    const response = await api.post(`/disputes/${id}/message`, { message });
    return response.data;
  },

  getMyDisputes: async (): Promise<Dispute[]> => {
    const response = await api.get('/disputes/my');
    return response.data;
  },

  resolve: async (id: string): Promise<Dispute> => {
    const response = await api.post(`/disputes/${id}/resolve`);
    return response.data;
  },
};
