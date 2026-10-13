import api from './client';
import type { Review, CreateReviewRequest } from './types';

export const reviewsAPI = {
  getAll: async (): Promise<Review[]> =>
    (await api.get<{ data: Review[] }>('/reviews')).data.data,

  getById: async (id: string): Promise<Review> =>
    (await api.get<{ data: Review }>(`/reviews/${id}`)).data.data,

  create: async (data: CreateReviewRequest): Promise<Review> =>
    (await api.post<{ data: Review }>('/reviews', data)).data.data,

  getForUser: async (userId: string) =>
    (
      await api.get(`/users/${userId}/reviews`)
    ).data,
  getForProperty: async (propertyId: string, params: Record<string, unknown> = {}) =>
    (await api.get(`/properties/${propertyId}/reviews`, { params })).data,
  getForListing: async (listingId: string) =>
    (await api.get<{ data: Review[] }>(`/reviews/listing/${listingId}`)).data.data,
  getListingSummary: async (listingId: string) =>
    (
      await api.get<{
        data: Review[];
        averageRating: number;
        count: number;
      }>(`/reviews/listing/${listingId}`)
    ).data,
  remove: async (id: string) => (await api.delete(`/reviews/${id}`)).data,
};
