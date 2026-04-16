import api from './client';
import type { User, Listing, TrustScore, Dispute, PaginatedResponse } from './types';

export const adminAPI = {
  // User Management
  getAllUsers: async (page = 1, limit = 20): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/admin/users', { params: { page, limit } });
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  suspendUser: async (id: string): Promise<User> => {
    const response = await api.patch(`/admin/users/${id}/suspend`);
    return response.data;
  },

  activateUser: async (id: string): Promise<User> => {
    const response = await api.patch(`/admin/users/${id}/activate`);
    return response.data;
  },

  // Listing Moderation
  getAllListings: async (page = 1, limit = 20): Promise<PaginatedResponse<Listing>> => {
    const response = await api.get('/admin/listings', { params: { page, limit } });
    return response.data;
  },

  getFlaggedListings: async (): Promise<Listing[]> => {
    const response = await api.get('/admin/listings/flagged');
    return response.data;
  },

  flagListing: async (id: string, reason: string): Promise<Listing> => {
    const response = await api.patch(`/admin/listings/${id}/flag`, { reason });
    return response.data;
  },

  approveListings: async (id: string): Promise<Listing> => {
    const response = await api.patch(`/admin/listings/${id}/approve`);
    return response.data;
  },

  rejectListing: async (id: string, reason: string): Promise<Listing> => {
    const response = await api.patch(`/admin/listings/${id}/reject`, { reason });
    return response.data;
  },

  removeListings: async (id: string): Promise<void> => {
    await api.delete(`/admin/listings/${id}`);
  },

  // Disputes
  getAllDisputes: async (page = 1, limit = 20): Promise<PaginatedResponse<Dispute>> => {
    const response = await api.get('/admin/disputes', { params: { page, limit } });
    return response.data;
  },

  // Trust Scores
  getTrustScore: async (userId: string): Promise<TrustScore> => {
    const response = await api.get(`/admin/trust-scores/${userId}`);
    return response.data;
  },

  updateTrustScore: async (userId: string, score: number): Promise<TrustScore> => {
    const response = await api.patch(`/admin/trust-scores/${userId}`, { score });
    return response.data;
  },

  // Dashboard Stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};
