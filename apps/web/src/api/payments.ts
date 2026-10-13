import api from './client';
import type { Payment, CreatePaymentRequest } from './types';

interface ApiEnvelope<T> {
  message: string;
  data: T;
  count?: number;
}

export interface InitiatePaymentResult {
  payment: Payment;
  redirectUrl?: string;
  alreadyExists: boolean;
}

export const paymentsAPI = {
  initiate: async (data: CreatePaymentRequest, idempotencyKey?: string) =>
    (
      await api.post<InitiatePaymentResult>('/payments', data, {
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      })
    ).data,
  create: async (data: CreatePaymentRequest) => paymentsAPI.initiate(data),
  getAll: async <T = Payment>() =>
    (await api.get<ApiEnvelope<T[]>>('/payments')).data.data,
  getById: async (id: string) => (await api.get<Payment>(`/payments/${id}`)).data,
  getMyPayments: async () =>
    (await api.get<ApiEnvelope<Payment[]>>('/payments/tenant/my-payments')).data.data,
  getHistory: async (agreementId: string) =>
    (
      await api.get<ApiEnvelope<Payment[]>>(`/payments/agreement/${agreementId}`)
    ).data.data,
  verify: async (id: string) => (await api.post<Payment>(`/payments/${id}/verify`)).data,
  receipt: async (id: string) => (await api.get(`/payments/${id}/receipt`)).data,
  refund: async (id: string) => (await api.post<Payment>(`/payments/${id}/refund`)).data,
};
