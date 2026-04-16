// Central export point for all API clients
// Usage: import { authAPI, listingsAPI, ... } from '@/api'

export { authAPI } from './auth';
export { listingsAPI } from './listings';
export { agreementsAPI } from './agreements';
export { paymentsAPI } from './payments';
export { disputesAPI } from './disputes';
export { reviewsAPI } from './reviews';
export { usersAPI } from './users';
export { adminAPI } from './admin';

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
  CreateAgreementRequest,
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
