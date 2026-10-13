import api from './client';
import type { User, Listing, Dispute, PaginatedResponse } from './types';

export interface AdminListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  type?: string;
  city?: string;
  verificationStatus?: string;
  from?: string;
  to?: string;
}

export const adminAPI = {
  // User Management
  getAllUsers: async (filters: AdminListFilters = {}): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  suspendUser: async (id: string, reason: string): Promise<User> => {
    const response = await api.post(`/admin/users/${id}/suspend`, { reason });
    return response.data;
  },

  activateUser: async (id: string, reason: string): Promise<User> => {
    const response = await api.post(`/admin/users/${id}/unsuspend`, { reason });
    return response.data;
  },

  verifyUser: async (id: string): Promise<User> =>
    (await api.post(`/admin/users/${id}/verify`)).data,
  verifyLandlordProfile: async (id: string) =>
    (await api.patch(`/admin/landlord-profiles/${id}/verify`)).data,

  // Listing Moderation
  getAllListings: async (filters: AdminListFilters = {}): Promise<PaginatedResponse<Listing>> => {
    const response = await api.get('/admin/listings', { params: filters });
    return response.data;
  },

  getProperties: async (filters: AdminListFilters = {}) => {
    const response = await api.get('/admin/properties', { params: filters });
    return response.data;
  },

  flagListing: async (id: string, reason: string): Promise<Listing> => {
    const response = await api.patch(`/admin/listings/${id}/flag`, { reason });
    return response.data;
  },
  verifyListing: async (id: string): Promise<Listing> =>
    (await api.patch(`/admin/listings/${id}/verify`)).data,

  // Disputes
  getAllDisputes: async (page = 1, limit = 20): Promise<PaginatedResponse<Dispute>> => {
    const response = await api.get('/admin/disputes', { params: { page, limit } });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  getDashboardActivity: async () =>
    (await api.get('/admin/dashboard/activity')).data,

  getResourcePage: async (path: string, filters: AdminListFilters = {}) => {
    const response = await api.get(path, { params: filters });
    return response.data;
  },
};
