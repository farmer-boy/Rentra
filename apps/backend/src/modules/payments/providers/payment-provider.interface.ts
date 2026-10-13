import { Payment, PaymentProviderType } from '@prisma/client';

export type ProviderPaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export interface ProviderInitiationResult {
  status: 'PENDING' | 'PROCESSING';
  transactionId?: string;
  redirectUrl?: string;
}

export interface ProviderVerificationResult {
  verified: boolean;
  status: ProviderPaymentStatus;
  transactionId?: string;
  paidAt?: Date;
}

export interface ProviderWebhookResult extends ProviderVerificationResult {
  paymentId?: string;
  providerEventId: string;
}

export interface ProviderRefundResult {
  verified: boolean;
  transactionId: string;
  status: 'REFUNDED';
}

export interface PaymentProviderAdapter {
  readonly provider: PaymentProviderType;
  initiate(payment: Payment): Promise<ProviderInitiationResult>;
  verify(payment: Payment): Promise<ProviderVerificationResult>;
  verifyWebhook(
    payload: unknown,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<ProviderWebhookResult>;
  refund?(
    payment: Payment,
    amount: number,
    idempotencyKey: string,
  ): Promise<ProviderRefundResult>;
}

export const PAYMENT_PROVIDER_ADAPTERS = Symbol('PAYMENT_PROVIDER_ADAPTERS');
