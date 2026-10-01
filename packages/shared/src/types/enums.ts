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
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
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
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
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