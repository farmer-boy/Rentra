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
  publicationStatus?: string;
  from?: string;
  to?: string;
}

export interface AdminDisputesResponse<T = Dispute> {
  data: T[];
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type AdminUserRecord = Pick<
  User,
  'id' | 'email' | 'fullName' | 'phone' | 'roles' | 'isSuspended' | 'createdAt' | 'updatedAt'
> & {
  isSuspended: boolean;
  trustScore: number;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  verificationSubmissions: Array<{ status: string }>;
};

export interface AdminUserDetails extends AdminUserRecord {
  updatedAt: string;
  properties: Array<{ id: string; title: string; status: string; verificationStatus: string; city: string; price: number | string }>;
  listings: Array<{ id: string; title: string; status: string; city: string; rent: number | string }>;
  bookings: Array<{ id: string; status: string; startDate: string; endDate: string; totalAmount: number | string }>;
  rentalsAsTenant: Array<{ id: string; status: string; createdAt: string; listing?: { title: string } | null }>;
  tenantAgreements: Array<{ id: string; status: string; startDate: string; endDate: string; monthlyRent: number | string }>;
  reviews: Array<{ id: string; rating: number; reviewType: string; createdAt: string }>;
  verificationSubmissions: Array<{ id: string; kind: string; status: string; submittedAt: string; reviewedAt: string | null }>;
  payments: Array<{ id: string; status: string; amount: number | string; currency: string; createdAt: string }>;
  reports: Array<{ id: string; status: string; reason: string; createdAt: string }>;
}

export interface AdminListingRecord {
  id: string;
  propertyId: string;
  title: string;
  type: string;
  status: string;
  publicationStatus: string;
  rent: number | string;
  city: string;
  createdAt: string;
  landlord: { id: string; fullName: string };
  property: { verificationStatus: string };
}

export interface AdminPropertyRecord {
  id: string;
  title: string;
  propertyType: string;
  status: string;
  verificationStatus: string;
  city: string;
  price: number | string;
  createdAt: string;
  owner: { id: string; fullName: string };
  hotel: { id: string; starRating: number } | null;
  hostel: { id: string; genderPolicy: string } | null;
}

export const adminAPI = {
  // User Management
  getAllUsers: async (filters: AdminListFilters = {}): Promise<PaginatedResponse<AdminUserRecord>> => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  getUserById: async (id: string): Promise<AdminUserDetails> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  sendUserNotice: async (id: string, reason: string, message: string) =>
    (await api.post(`/admin/users/${id}/notices`, { reason, message })).data,

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
  getAllListings: async (filters: AdminListFilters = {}): Promise<PaginatedResponse<AdminListingRecord>> => {
    const response = await api.get('/admin/listings', { params: filters });
    return response.data;
  },

  getProperties: async (filters: AdminListFilters = {}): Promise<PaginatedResponse<AdminPropertyRecord>> => {
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
  getAllDisputes: async (page = 1, limit = 20, status?: string): Promise<AdminDisputesResponse> => {
    const response = await api.get('/admin/disputes', { params: { page, limit, ...(status && { status }) } });
    return response.data;
  },

  resolveDispute: async (id: string, resolution: string) =>
    (await api.patch(`/admin/disputes/${id}/resolve`, { resolution })).data,

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
