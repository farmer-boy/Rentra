import api from './client';

export interface CreateMessageInput {
  content?: string;
  attachmentUrl?: string;
}

export const messagesAPI = {
  conversations: async () => (await api.get('/messages/conversations')).data,
  getOrCreateConversation: async (otherUserId: string, listingId?: string) =>
    (await api.post(`/messages/conversation/${otherUserId}`, {}, { params: { listingId } })).data,
  messages: async (conversationId: string, limit = 50, offset = 0) =>
    (await api.get(`/messages/conversation/${conversationId}`, { params: { limit, offset } })).data,
  send: async (conversationId: string, body: CreateMessageInput) =>
    (await api.post(`/messages/conversation/${conversationId}/send`, body)).data,
  markRead: async (conversationId: string) =>
    (await api.post(`/messages/conversation/${conversationId}/read`)).data,
  unreadCount: async () => (await api.get<{ unreadCount: number }>('/messages/unread-count')).data,
  legacyNotifications: async () => (await api.get('/messages/notifications')).data,
  markLegacyNotificationRead: async (id: string) =>
    (await api.post(`/messages/notifications/${id}/read`)).data,
};
