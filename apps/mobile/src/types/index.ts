// User and Auth Types
export type Role = 'ADMIN' | 'LANDLORD' | 'TENANT';
export type PropertyType =
  | 'HOUSE'
  | 'APARTMENT'
  | 'FLAT'
  | 'PORTION'
  | 'ROOM'
  | 'HOSTEL'
  | 'HOTEL'
  | 'GUEST_HOUSE'
  | 'STUDIO'
  | 'FARMHOUSE'
  | 'PG'
  | 'SHARED_ROOM';
export type FurnishedStatus = 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';
export type ListingAvailability = 'AVAILABLE' | 'RENTED';
export type RentalDuration = 'DAILY' | 'NIGHTLY' | 'WEEKLY' | 'MONTHLY' | 'LONG_TERM';
export type HostelGenderPolicy = 'MALE' | 'FEMALE' | 'MIXED';
export type LocationLevel = 'COUNTRY' | 'PROVINCE' | 'CITY' | 'AREA' | 'BLOCK_SECTOR';
export type ListingStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'INACTIVE';
export type AgreementStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ACTIVE'
  | 'ENDED'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'CANCELLED';
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH';
export type PaymentProviderType =
  | 'JAZZCASH'
  | 'EASYPAISA'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'OTHER'
  | 'LEGACY';
export type DisputeStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  cnic?: string;
  role: Role;
  roles?: Role[];
  trustScore: number;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt?: string;
  locationId?: string;
  location?: {
    id: string;
    name: string;
    slug: string;
    level: LocationLevel;
    parentId?: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  cnic: string;
  password: string;
  role: Exclude<Role, 'ADMIN'>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  area: string;
  city: string;
  address: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  unitCount: number;
  roomCount: number;
  sqft: number;
  rent: number;
  deposit: number;
  status: ListingStatus;
  furnishedStatus: FurnishedStatus;
  availability: ListingAvailability;
  rentalDuration: RentalDuration;
  availableFrom?: string;
  fraudScore: number;
  photos: string[];
  landlordId: string;
  createdAt: string;
  updatedAt: string;
  hostelDetails?: {
    buildingName: string;
    genderPolicy: HostelGenderPolicy;
    bedCapacity: number;
    availableBeds: number;
    messIncluded: boolean;
    wifiIncluded: boolean;
    laundryIncluded: boolean;
    electricityIncluded: boolean;
    securityIncluded: boolean;
  };
  hostelRooms?: Array<{
    roomNumber: string;
    capacity: number;
    availableBeds: number;
  }>;
}

export interface Agreement {
  id: string;
  listingId: string;
  tenantId: string;
  landlordId: string;
  monthlyRent: number;
  securityDeposit: number | null;
  startDate: string;
  endDate: string | null;
  paymentDueDay: number;
  rules: string | null;
  pdfUrl?: string;
  status: AgreementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string | null;
  agreementId: string | null;
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentProviderType;
  status: PaymentStatus;
  transactionId: string | null;
  paidAt: string | null;
  billingMonth: string | null;
  dueAt: string | null;
  createdAt: string;
}

export interface Dispute {
  id: string;
  agreementId: string;
  tenantId: string;
  title: string;
  description: string;
  amount?: number;
  status: DisputeStatus;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  listingId?: string;
  agreementId?: string;
  lastMessageAt: string;
  createdAt: string;
  messages?: Message[];
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}
