// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  cnic?: string;
  password?: string;
  role?: 'TENANT' | 'LANDLORD' | 'ADMIN';
  roles?: Array<'TENANT' | 'LANDLORD' | 'ADMIN'>;
  trustScore: number;
  isVerified: boolean;
  isSuspended?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  cnic?: string;
  role?: 'TENANT' | 'LANDLORD' | 'ADMIN';
  roles?: Array<'TENANT' | 'LANDLORD' | 'ADMIN'>;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  message?: string;
}

export interface TrustScore {
  userId: string;
  overallScore: number;
  responseRate: number;
  verificationLevel: string;
  createdAt: string;
  updatedAt: string;
}

// Listing types
export interface Listing {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  images: string[];
  amenities: string[];
  landlordId: string;
  status: 'ACTIVE' | 'PENDING' | 'FLAGGED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  province: string;
  rent: number;
  area: string;
  sqft: number;
  deposit: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  rules?: string;
  blockSector?: string;
  rentalDuration?: string;
  availableFrom?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  imageUrls?: string[];
  amenities?: string[];
}

// Agreement types
export interface Agreement {
  id: string;
  listingId: string;
  tenantId: string;
  landlordId: string;
  monthlyRent: number;
  securityDeposit: number | null;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Payment types
export interface Payment {
  id: string;
  userId: string;
  bookingId: string | null;
  agreementId: string | null;
  amount: number;
  currency: string;
  provider: 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'BANK_TRANSFER' | 'OTHER' | 'LEGACY';
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionId: string | null;
  paidAt: string | null;
  billingMonth: string | null;
  dueAt: string | null;
  createdAt: string;
}

export interface CreatePaymentRequest {
  bookingId?: string;
  agreementId?: string;
  billingMonth?: string;
  provider: 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
}

// Dispute types
export interface Dispute {
  id: string;
  type: string;
  reason: string;
  description: string;
  status: string;
  bookingId?: string | null;
  paymentId?: string | null;
  agreementId?: string | null;
  createdById: string;
  updatedAt: string;
  createdAt: string;
}

export interface CreateDisputeRequest {
  type: string;
  reason: string;
  description: string;
  bookingId?: string;
  paymentId?: string;
  agreementId?: string;
}

// Review types
export interface Review {
  id: string;
  userId: string;
  listingId: string;
  propertyId?: string | null;
  bookingId?: string | null;
  agreementId?: string | null;
  reviewType: 'PROPERTY' | 'LANDLORD';
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  reviewType: 'PROPERTY' | 'LANDLORD';
  listingId: string;
  bookingId?: string;
  agreementId?: string;
  rating: number;
  comment?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  count?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
