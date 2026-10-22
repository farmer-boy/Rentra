import api from './client';

export type SupportTicketCategory = 'ACCOUNT' | 'VERIFICATION' | 'LISTING' | 'PAYMENT' | 'SAFETY' | 'OTHER';
export type SupportTicketStatus = 'NEW' | 'OPEN' | 'PENDING' | 'RESOLVED';

export interface SupportTicketMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { id: string; fullName: string; roles: string[] };
}

export interface SupportTicket {
  id: string;
  userId: string;
  category: SupportTicketCategory;
  subject: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  user: { id: string; fullName: string; email: string; supportBlockedUntil?: string | null; supportWarningCount?: number };
  messages: SupportTicketMessage[];
}

export interface MySupportTickets {
  items: SupportTicket[];
  supportBlockedUntil: string | null;
  supportWarningCount: number;
}

export const supportAPI = {
  mine: async () => (await api.get<MySupportTickets>('/support/tickets')).data,
  create: async (body: { category: SupportTicketCategory; subject: string; message: string }) =>
    (await api.post<SupportTicket>('/support/tickets', body)).data,
  get: async (id: string) => (await api.get<SupportTicket>(`/support/tickets/${id}`)).data,
  reply: async (id: string, body: string) =>
    (await api.post<SupportTicket>(`/support/tickets/${id}/replies`, { body })).data,
  adminList: async (status?: SupportTicketStatus | '') =>
    (await api.get<SupportTicket[]>('/support/admin/tickets', { params: status ? { status } : {} })).data,
  adminReply: async (id: string, body: string) =>
    (await api.post<SupportTicket>(`/support/admin/tickets/${id}/replies`, { body })).data,
  setStatus: async (id: string, status: SupportTicketStatus) =>
    (await api.patch<SupportTicket>(`/support/admin/tickets/${id}/status`, { status })).data,
  warn: async (id: string, reason: string) =>
    (await api.post(`/support/admin/tickets/${id}/warn`, { reason })).data,
  restrict: async (userId: string, reason: string, durationDays: number) =>
    (await api.post(`/support/admin/users/${userId}/restrict`, { reason, durationDays })).data,
  restore: async (userId: string, reason: string) =>
    (await api.post(`/support/admin/users/${userId}/restore`, { reason })).data,
};
