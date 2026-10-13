import api from './client';
import type { CreateListingRequest, Listing } from './types';

export type CreateListingInput = CreateListingRequest;

export const listingsAPI = {
  getAll: async <T = Listing>(params: Record<string, unknown> = {}) =>
    (
      await api.get<{ data: T[]; pagination: unknown }>('/listings', {
        params,
      })
    ).data,

  getOne: async <T = Listing>(id: string): Promise<T> => {
    const response = await api.get<{ data: T }>(`/listings/${id}`);
    return response.data.data;
  },

  create: async <T = Listing>(data: CreateListingInput): Promise<T> => {
    const response = await api.post<{ data: T }>('/listings', data);
    return response.data.data;
  },

  update: async <T = Listing>(id: string, data: Partial<CreateListingInput>): Promise<T> => {
    const response = await api.patch<{ data: T }>(`/listings/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/listings/${id}`);
  },

  getMyListings: async <T = Listing>(params: Record<string, unknown> = {}): Promise<T[]> => {
    const response = await api.get<{ data: T[] }>('/listings/landlord/my-listings', { params });
    return response.data.data;
  },

  getLandlordAnalytics: async () => {
    const response = await api.get('/listings/landlord/analytics');
    return response.data;
  },

  setAvailability: async (id: string, availability: 'AVAILABLE' | 'RENTED') =>
    (await api.patch(`/listings/${id}/availability`, { availability })).data,
  publish: async <T = Listing>(id: string) =>
    (await api.patch<{ data: T }>(`/listings/${id}/publish`)).data.data,
  unpublish: async <T = Listing>(id: string) =>
    (await api.patch<{ data: T }>(`/listings/${id}/unpublish`)).data.data,
  recordView: async (id: string, sessionId?: string) =>
    (await api.post(`/listings/${id}/view`, { sessionId })).data,
  uploadImage: async (id: string, formData: FormData) =>
    (await api.post(`/listings/${id}/images/upload`, formData)).data,
};
