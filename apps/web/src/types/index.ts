export type Role = 'TENANT' | 'LANDLORD' | 'ADMIN';
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'AUTHORIZED'
  | 'PAID'
  | 'COMPLETED'
  | 'PARTIALLY_REFUNDED';
export type PaymentProviderType =
  | 'JAZZCASH'
  | 'EASYPAISA'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'OTHER'
  | 'LEGACY';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cnic?: string;
  role?: Role;
  roles?: Role[];
  trustScore: number;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  area: string;
  city: string;
  address: string;
  type:
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
  furnishedStatus: 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';
  availability: 'AVAILABLE' | 'RENTED';
  rentalDuration: 'DAILY' | 'NIGHTLY' | 'WEEKLY' | 'MONTHLY' | 'LONG_TERM';
  availableFrom?: string;
  unitCount: number;
  roomCount: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  rent: number;
  deposit: number;
  status: 'PENDING' | 'VERIFIED' | 'FLAGGED' | 'REMOVED';
  fraudScore: number;
  photos: string[];
  landlordId: string;
  landlord?: User;
  locationId?: string;
  location?: Location;
  hostelDetails?: HostelDetails;
  hostelRooms?: HostelRoom[];
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  level: 'COUNTRY' | 'PROVINCE' | 'CITY' | 'AREA' | 'BLOCK_SECTOR';
  parentId?: string;
  parent?: Location;
}

export interface HostelDetails {
  buildingName: string;
  genderPolicy: 'MALE' | 'FEMALE' | 'MIXED';
  bedCapacity: number;
  availableBeds: number;
  messIncluded: boolean;
  wifiIncluded: boolean;
  laundryIncluded: boolean;
  electricityIncluded: boolean;
  securityIncluded: boolean;
}

export interface HostelRoom {
  roomNumber: string;
  capacity: number;
  availableBeds: number;
}

export interface Agreement {
  id: string;
  listingId: string;
  listing?: Listing;
  tenantId: string;
  tenant?: User;
  landlordId: string;
  landlord?: User;
  rent: number;
  deposit: number;
  startDate: string;
  endDate: string;
  pdfUrl?: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  bookingId: string | null;
  agreementId: string | null;
  agreement?: Agreement;
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
  agreement?: Agreement;
  tenantId: string;
  tenant?: User;
  title: string;
  description: string;
  amount?: number;
  status: 'OPEN' | 'MEDIATION' | 'RESOLVED' | 'CLOSED';
  resolution?: string;
  createdAt: string;
}
