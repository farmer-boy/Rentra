import api from './client';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  read: boolean;
  createdAt: string;
}

export interface CreateContactMessageInput {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ContactMessagesResponse {
  success: boolean;
  data: ContactMessage[];
}

export const contactsAPI = {
  create: async (body: CreateContactMessageInput) =>
    (await api.post('/contact/message', body)).data,
  list: async () =>
    (await api.get<ContactMessagesResponse>('/contact/messages')).data.data,
  byId: async (id: string) =>
    (await api.get<ContactMessage>(`/contact/message/${id}`)).data,
  markRead: async (id: string) =>
    (await api.patch<ContactMessage>(`/contact/message/${id}/read`)).data,
  remove: async (id: string) =>
    (await api.delete(`/contact/message/${id}`)).data,
};
