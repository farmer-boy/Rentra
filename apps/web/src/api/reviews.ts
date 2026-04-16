import api from './client';
import type { Review, CreateReviewRequest, PaginatedResponse } from './types';

export const reviewsAPI = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Review>> => {
    const response = await api.get('/reviews', { params: { page, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<Review> => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  create: async (data: CreateReviewRequest): Promise<Review> => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  getByUser: async (userId: string): Promise<Review[]> => {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data;
  },

  getForUser: async (userId: string): Promise<Review[]> => {
    const response = await api.get(`/reviews/for/${userId}`);
    return response.data;
  },
};
