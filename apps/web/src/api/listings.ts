import api from './client';
import type { Listing, CreateListingRequest, PaginatedResponse } from './types';

export const listingsAPI = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Listing>> => {
    const response = await api.get('/listings', { params: { page, limit } });
    return response.data;
  },

  getOne: async (id: string): Promise<Listing> => {
    const response = await api.get(`/listings/${id}`);
    return response.data;
  },

  create: async (data: CreateListingRequest): Promise<Listing> => {
    const response = await api.post('/listings', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateListingRequest>): Promise<Listing> => {
    const response = await api.patch(`/listings/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/listings/${id}`);
  },

  getMyListings: async (): Promise<Listing[]> => {
    const response = await api.get('/listings/my');
    return response.data;
  },

  getByLandlord: async (landlordId: string): Promise<Listing[]> => {
    const response = await api.get(`/listings/landlord/${landlordId}`);
    return response.data;
  },

  search: async (query: string): Promise<Listing[]> => {
    const response = await api.get('/listings/search', { params: { q: query } });
    return response.data;
  },
};
