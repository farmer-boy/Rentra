import api from './client';
import type { Listing } from './types';

export interface ListingSearchParams {
  page?: number;
  limit?: number;
  city?: string;
  area?: string;
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  [key: string]: unknown;
}

export interface ListingSearchResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const searchAPI = {
  listings: async <T = Listing>(params: ListingSearchParams = {}) =>
    (await api.get<ListingSearchResponse<T>>('/listings', { params })).data,
  properties: async (params: Record<string, unknown> = {}) =>
    (await api.get('/properties/search', { params })).data,
  nearby: async (params: Record<string, unknown>) =>
    (await api.get('/properties/nearby', { params })).data,
};
