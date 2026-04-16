import api from './client';
import type { Agreement, CreateAgreementRequest, PaginatedResponse } from './types';

export const agreementsAPI = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Agreement>> => {
    const response = await api.get('/agreements', { params: { page, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<Agreement> => {
    const response = await api.get(`/agreements/${id}`);
    return response.data;
  },

  create: async (data: CreateAgreementRequest): Promise<Agreement> => {
    const response = await api.post('/agreements', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateAgreementRequest>): Promise<Agreement> => {
    const response = await api.patch(`/agreements/${id}`, data);
    return response.data;
  },

  sign: async (id: string): Promise<Agreement> => {
    const response = await api.post(`/agreements/${id}/sign`);
    return response.data;
  },

  getByListing: async (listingId: string): Promise<Agreement[]> => {
    const response = await api.get(`/agreements/listing/${listingId}`);
    return response.data;
  },
};
