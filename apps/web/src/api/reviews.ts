import api from './client';
import type { Review, CreateReviewRequest } from './types';

export interface ListingReviewSummary {
  message: string;
  data: Review[];
  averageRating: number;
  count: number;
}

export interface PropertyReviewRecord extends Review {
  user?: {
    id: string;
    fullName: string;
    profile?: { avatarUrl: string | null } | null;
  };
}

export interface PropertyReviewsResponse {
  data: PropertyReviewRecord[];
  totalCount: number;
  count: number;
  averageRating: number;
  pagination: { page: number; limit: number; totalPages: number };
}

export interface ReviewEligibility {
  agreementId: string;
  eligible: boolean;
  alreadyReviewed: boolean;
  reviewType: 'LANDLORD' | 'TENANT';
  target: { id: string; fullName: string };
  reason: string | null;
}

export const reviewsAPI = {
  getAll: async (): Promise<Review[]> =>
    (await api.get<{ data: Review[] }>('/reviews')).data.data,

  getById: async (id: string): Promise<Review> =>
    (await api.get<{ data: Review }>(`/reviews/${id}`)).data.data,

  create: async (data: CreateReviewRequest): Promise<Review> =>
    (await api.post<{ data: Review }>('/reviews', data)).data.data,

  getForUser: async (userId: string) =>
    (await api.get(`/reviews/user/${userId}`)).data,
  getMyReceived: async () => (await api.get('/reviews/my')).data,
  getMySubmitted: async (): Promise<Review[]> =>
    (await api.get<{ data: Review[] }>('/reviews/my-submitted')).data.data,
  getEligibility: async (agreementId: string): Promise<ReviewEligibility> =>
    (await api.get<ReviewEligibility>(`/reviews/eligibility/${agreementId}`))
      .data,
  getForAgreement: async (agreementId: string): Promise<Review[]> =>
    (await api.get<{ data: Review[] }>(`/reviews/agreement/${agreementId}`))
      .data.data,
  getForProperty: async (
    propertyId: string,
    params: Record<string, unknown> = {},
  ): Promise<PropertyReviewsResponse> =>
    (
      await api.get<PropertyReviewsResponse>(
        `/properties/${propertyId}/reviews`,
        { params },
      )
    ).data,
  getForListing: async (listingId: string) =>
    (await api.get<{ data: Review[] }>(`/reviews/listing/${listingId}`)).data
      .data,
  getListingSummary: async (listingId: string): Promise<ListingReviewSummary> =>
    (await api.get<ListingReviewSummary>(`/reviews/listing/${listingId}`)).data,
  remove: async (id: string) => (await api.delete(`/reviews/${id}`)).data,
};
