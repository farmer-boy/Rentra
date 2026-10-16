// Central export point for all API clients
// Usage: import { authAPI, listingsAPI, ... } from '@/api'

export { authAPI } from './auth';
export { listingsAPI } from './listings';
export { agreementsAPI } from './agreements';
export { paymentsAPI } from './payments';
export { disputesAPI } from './disputes';
export type { CreateDisputeInput } from './disputes';
export type { DisputeRecord, DisputeListResponse } from './disputes';
export { reviewsAPI } from './reviews';
export { usersAPI } from './users';
export { adminAPI } from './admin';
export { propertiesAPI } from './properties';
export type { PropertyRecord, CreatePropertyInput } from './properties';
export type { CreateListingInput } from './listings';
export { searchAPI } from './search';
export { favoritesAPI } from './favorites';
export { savedSearchesAPI } from './savedSearches';
export { messagesAPI } from './messages';
export { notificationsAPI } from './notifications';
export { rentalRequestsAPI } from './rentalRequests';
export { bookingsAPI } from './bookings';
export { availabilityAPI } from './availability';
export { reportsAPI } from './reports';
export { verificationAPI } from './verification';
export { recommendationsAPI } from './recommendations';
export { contactsAPI } from './contacts';

// Export types
export type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TrustScore,
  Listing,
  CreateListingRequest,
  Agreement,
  Payment,
  CreatePaymentRequest,
  Dispute,
  CreateDisputeRequest,
  Review,
  CreateReviewRequest,
  ApiResponse,
  PaginatedResponse,
} from './types';

// Export default client for custom usage
export { default as api } from './client';
