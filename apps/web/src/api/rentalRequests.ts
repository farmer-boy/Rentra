import api from './client';

export interface CreateRentalRequestInput {
  moveInDate?: string;
  duration?: number;
  occupants?: number;
  message?: string;
}

export interface AcceptRentalRequestInput {
  rent?: number;
  deposit?: number;
  startDate?: string;
  endDate?: string;
  paymentDueDay?: number;
  rules?: string;
}

export const rentalRequestsAPI = {
  mine: async <T = unknown>() => (await api.get<T[]>('/rental-requests/my')).data,
  received: async <T = unknown>() => (await api.get<T[]>('/rental-requests/received')).data,
  create: async <T = unknown>(propertyId: string, body: CreateRentalRequestInput) =>
    (await api.post<T>(`/properties/${propertyId}/rental-requests`, body)).data,
  accept: async <T = unknown>(id: string, body: AcceptRentalRequestInput = {}) =>
    (await api.patch<T>(`/rental-requests/${id}/accept`, body)).data,
  reject: async <T = unknown>(id: string) =>
    (await api.patch<T>(`/rental-requests/${id}/reject`)).data,
  cancel: async <T = unknown>(id: string) =>
    (await api.patch<T>(`/rental-requests/${id}/cancel`)).data,
};
