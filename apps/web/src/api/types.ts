// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  cnic: string;
  password?: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
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
  cnic: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
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
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  images: string[];
  amenities: string[];
}

// Agreement types
export interface Agreement {
  id: string;
  title: string;
  content: string;
  listingId: string;
  tenantId: string;
  landlordId: string;
  status: 'PENDING' | 'SIGNED' | 'TERMINATED';
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgreementRequest {
  title: string;
  content: string;
  listingId: string;
  tenantId: string;
}

// Payment types
export interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  type: 'RENT' | 'DEPOSIT' | 'OTHER';
  agreementId: string;
  paidBy: string;
  paidTo: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  amount: number;
  type: 'RENT' | 'DEPOSIT' | 'OTHER';
  agreementId: string;
  dueDate: string;
}

// Dispute types
export interface Dispute {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  agreementId: string;
  initiatedBy: string;
  updatedAt: string;
  createdAt: string;
}

export interface CreateDisputeRequest {
  title: string;
  description: string;
  agreementId: string;
}

// Review types
export interface Review {
  id: string;
  rating: number;
  comment: string;
  authorId: string;
  targetUserId: string;
  agreementId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
  targetUserId: string;
  agreementId: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
