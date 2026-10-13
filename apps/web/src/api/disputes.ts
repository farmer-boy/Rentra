import api from './client';
import type { CreateDisputeRequest } from './types';

export type CreateDisputeInput = CreateDisputeRequest;

export const disputesAPI = {
  mine: async <T = unknown>(params: Record<string, unknown> = {}) =>
    (await api.get<T>('/disputes/my', { params })).data,
  byId: async <T = unknown>(id: string) =>
    (await api.get<T>(`/disputes/${id}`)).data,
  create: async <T = unknown>(data: CreateDisputeInput) =>
    (await api.post<T>('/disputes', data)).data,
};
