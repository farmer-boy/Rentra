import api from './client';
import type { Payment, CreatePaymentRequest, PaginatedResponse } from './types';

export const paymentsAPI = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Payment>> => {
    const response = await api.get('/payments', { params: { page, limit } });
    return response.data;
  },

  getById: async (id: string): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  create: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  getHistory: async (agreementId: string): Promise<Payment[]> => {
    const response = await api.get(`/payments/agreement/${agreementId}`);
    return response.data;
  },

  getMyPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/my');
    return response.data;
  },
};
