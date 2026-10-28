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

export interface RejectRentalRequestInput { reason?: string }
export interface RequestInformationInput { message: string }

export const rentalRequestsAPI = {
  mine: async <T = unknown>() => (await api.get<T[]>('/rental-requests/my')).data,
  received: async <T = unknown>() => (await api.get<T[]>('/rental-requests/received')).data,
  reviewProfile: async <T = unknown>(id: string) => (await api.get<T>(`/rental-requests/${id}/review-profile`)).data,
  create: async <T = unknown>(propertyId: string, body: CreateRentalRequestInput) =>
    (await api.post<T>(`/properties/${propertyId}/rental-requests`, body)).data,
  accept: async <T = unknown>(id: string, body: AcceptRentalRequestInput = {}) =>
    (await api.patch<T>(`/rental-requests/${id}/accept`, body)).data,
  reject: async <T = unknown>(id: string, body: RejectRentalRequestInput = {}) =>
    (await api.patch<T>(`/rental-requests/${id}/reject`, body)).data,
  requestInformation: async <T = unknown>(id: string, body: RequestInformationInput) =>
    (await api.post<T>(`/rental-requests/${id}/request-information`, body)).data,
  respondToInformation: async <T = unknown>(id: string, body: RequestInformationInput) =>
    (await api.post<T>(`/rental-requests/${id}/respond-information`, body)).data,
  cancel: async <T = unknown>(id: string) =>
    (await api.patch<T>(`/rental-requests/${id}/cancel`)).data,
};
