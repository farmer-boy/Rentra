import api from './client';
import type { CreateDisputeRequest } from './types';

export type CreateDisputeInput = CreateDisputeRequest;

export interface DisputeRecord {
  id: string;
  type: string;
  reason: string;
  description: string;
  status: string;
  createdById: string;
  bookingId: string | null;
  paymentId: string | null;
  agreementId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeListResponse {
  data: DisputeRecord[];
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const disputesAPI = {
  mine: async (params: Record<string, unknown> = {}) =>
    (await api.get<DisputeListResponse>('/disputes/my', { params })).data,
  byId: async <T = unknown>(id: string) =>
    (await api.get<T>(`/disputes/${id}`)).data,
  create: async <T = unknown>(data: CreateDisputeInput) =>
    (await api.post<T>('/disputes', data)).data,
};
