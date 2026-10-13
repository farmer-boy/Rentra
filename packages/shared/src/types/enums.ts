export enum Role {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export enum PropertyType {
  HOUSE = 'HOUSE',
  APARTMENT = 'APARTMENT',
  FLAT = 'FLAT',
  PORTION = 'PORTION',
  ROOM = 'ROOM',
  HOSTEL = 'HOSTEL',
  HOTEL = 'HOTEL',
  GUEST_HOUSE = 'GUEST_HOUSE',
  STUDIO = 'STUDIO',
  FARMHOUSE = 'FARMHOUSE',
  PG = 'PG',
  SHARED_ROOM = 'SHARED_ROOM',
}

export enum ListingStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED',
}

export enum AgreementStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  TERMINATED = 'TERMINATED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  JAZZCASH = 'JAZZCASH',
  EASYPAISA = 'EASYPAISA',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentProviderType {
  JAZZCASH = 'JAZZCASH',
  EASYPAISA = 'EASYPAISA',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
  LEGACY = 'LEGACY',
}

export interface PaymentResponse {
  id: string;
  userId: string;
  bookingId: string | null;
  agreementId: string | null;
  amount: number;
  currency: string;
  provider: PaymentProviderType;
  transactionId: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  billingMonth: string | null;
  dueAt: string | null;
  createdAt: string;
}

export interface CreatePaymentRequest {
  bookingId?: string;
  agreementId?: string;
  billingMonth?: string;
  provider: PaymentProviderType;
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  MEDIATION = 'MEDIATION',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum HostelGenderPolicy {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  MIXED = 'MIXED',
}

export enum LocationLevel {
  COUNTRY = 'COUNTRY',
  PROVINCE = 'PROVINCE',
  CITY = 'CITY',
  AREA = 'AREA',
  BLOCK_SECTOR = 'BLOCK_SECTOR',
}

export enum RentalDuration {
  DAILY = 'DAILY',
  NIGHTLY = 'NIGHTLY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  LONG_TERM = 'LONG_TERM',
}