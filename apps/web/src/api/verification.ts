import api from './client';

export interface VerificationReviewInput {
  decision: 'APPROVED' | 'REJECTED';
  reviewNotes: string;
}

export const verificationAPI = {
  mine: async () => (await api.get('/verification/me')).data,
  submitUser: async (body: Record<string, unknown>) =>
    (await api.post('/verification/submissions', body)).data,
  submitProperty: async (propertyId: string, body: Record<string, unknown>) =>
    (await api.post(`/verification/properties/${propertyId}`, body)).data,
  sendPhoneCode: async () => (await api.post('/verification/phone/send')).data,
  confirmPhone: async (code: string) =>
    (await api.post('/verification/phone/confirm', { code })).data,
  pending: async <T = unknown>() =>
    (await api.get<T[]>('/verification/admin/submissions')).data,
  adminDetail: async <T = unknown>(id: string) =>
    (await api.get<T>(`/verification/admin/submissions/${id}`)).data,
  review: async (id: string, body: VerificationReviewInput) =>
    (await api.patch(`/verification/admin/submissions/${id}`, body)).data,
  revoke: async (id: string, reason: string) =>
    (await api.post(`/verification/admin/submissions/${id}/revoke`, { reason })).data,
};
