export enum Role {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export enum PropertyType {
  FLAT = 'FLAT',
  ROOM = 'ROOM',
  HOUSE = 'HOUSE',
  STUDIO = 'STUDIO',
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