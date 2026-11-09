import api from './client';
import type { Agreement } from './types';

export interface AgreementTerminationRequest {
  id: string;
  agreementId: string;
  requestedById: string;
  requestReason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  respondedById?: string | null;
  decisionReason?: string | null;
  reviewRating?: number | null;
  reviewComment?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  responses?: Array<{
    id: string;
    responderId: string;
    decision: 'APPROVED' | 'REJECTED' | 'ACCEPTED_REJECTION' | 'CONTESTED';
    reason?: string | null;
    reviewRating?: number | null;
    reviewComment?: string | null;
    createdAt: string;
  }>;
  reviews?: Array<{
    id: string;
    reviewerId: string;
    targetUserId: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}


export const agreementsAPI = {
  mine: async <T = Agreement>(): Promise<T[]> =>
    (await api.get<{ data: T[] }>('/agreements/my')).data.data,

  getById: async <T = Agreement>(id: string): Promise<T> =>
    (await api.get<{ data: T }>(`/agreements/${id}`)).data.data,

  markPageOpen: async (id: string) =>
    (await api.post(`/agreements/${id}/presence`)).data,


  reviewCancellation: async (agreementId: string, requestId: string, body: { rating: number; comment: string }) =>
    (await api.post(`/agreements/${agreementId}/termination-requests/${requestId}/reviews`, body)).data.data,

  terminate: async (id: string, reason: string): Promise<AgreementTerminationRequest> =>
    (
      await api.patch<{ data: AgreementTerminationRequest }>(`/agreements/${id}/terminate`, {
        reason,
      })
    ).data.data,

  respondToTermination: async (agreementId: string, requestId: string, body: { decision: 'APPROVE' | 'REJECT'; reason?: string }): Promise<Agreement> =>
    (await api.patch<{ data: Agreement }>(`/agreements/${agreementId}/termination-requests/${requestId}/respond`, body)).data.data,

  respondToTerminationOutcome: async (agreementId: string, requestId: string, decision: 'ACCEPT_REJECTION' | 'CONTEST', reason?: string): Promise<Agreement> =>
    (await api.patch<{ data: Agreement }>(`/agreements/${agreementId}/termination-requests/${requestId}/outcome`, { decision, reason })).data.data,

  proposeTerms: async (id: string, terms: { proposedMonthlyRent: number; proposedSecurityDeposit: number; reason?: string }) =>
    (await api.post(`/agreements/${id}/amendments`, terms)).data.data,

  respondToAmendment: async (agreementId: string, amendmentId: string, body: { decision: 'ACCEPT' | 'REJECT'; reason?: string }): Promise<Agreement> =>
    (await api.patch<{ data: Agreement }>(`/agreements/${agreementId}/amendments/${amendmentId}/respond`, body)).data.data,
};
