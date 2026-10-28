import api from './client';

export interface CreateMessageInput {
  content?: string;
  attachmentUrl?: string;
}

export interface ConversationParticipant {
  id: string;
  fullName: string;
  email?: string;
}

export interface ConversationRecord {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  createdAt: string;
  participant1: ConversationParticipant;
  participant2: ConversationParticipant;
  listing?: { id: string; title: string; city: string; area: string } | null;
  property?: { id: string; title: string; city: string; area: string } | null;
  booking?: { id: string; startDate: string; endDate: string; status: string } | null;
}

export const messagesAPI = {
  conversations: async () => (await api.get('/messages/conversations')).data,
  getOrCreateConversation: async (otherUserId: string, listingId?: string, propertyId?: string) =>
    (await api.post<ConversationRecord>(`/messages/conversation/${otherUserId}`, {}, { params: { ...(listingId && { listingId }), ...(propertyId && { propertyId }) } })).data,
  messages: async (conversationId: string, limit = 50, offset = 0) =>
    (await api.get(`/messages/conversation/${conversationId}`, { params: { limit, offset } })).data,
  send: async (conversationId: string, body: CreateMessageInput) =>
    (await api.post(`/messages/conversation/${conversationId}/send`, body)).data,
  update: async (conversationId: string, messageId: string, content: string) =>
    (await api.patch(`/messages/conversation/${conversationId}/${messageId}`, { content })).data,
  delete: async (conversationId: string, messageId: string) =>
    (await api.delete(`/messages/conversation/${conversationId}/${messageId}`)).data,
  star: async (conversationId: string, messageId: string, isStarred: boolean) =>
    (await api.post(`/messages/conversation/${conversationId}/${messageId}/star`, { isStarred })).data,
  markRead: async (conversationId: string) =>
    (await api.post(`/messages/conversation/${conversationId}/read`)).data,
  markUnread: async (conversationId: string) =>
    (await api.post(`/messages/conversation/${conversationId}/unread`)).data,
  archive: async (conversationId: string) =>
    (await api.post(`/messages/conversation/${conversationId}/archive`)).data,
  unarchive: async (conversationId: string) =>
    (await api.post(`/messages/conversation/${conversationId}/unarchive`)).data,
  favorite: async (conversationId: string, isFavorite: boolean) =>
    (await api.post(`/messages/conversation/${conversationId}/favorite`, { isFavorite })).data,
  pin: async (conversationId: string, isPinned: boolean) =>
    (await api.post(`/messages/conversation/${conversationId}/pin`, { isPinned })).data,
  block: async (conversationId: string, isBlocked: boolean) =>
    (await api.post(`/messages/conversation/${conversationId}/block`, { isBlocked })).data,
  mute: async (conversationId: string, duration: number | 'always') =>
    (await api.post(`/messages/conversation/${conversationId}/mute`, { duration })).data,
  unmute: async (conversationId: string) =>
    (await api.post(`/messages/conversation/${conversationId}/unmute`)).data,
  deleteConversation: async (conversationId: string) =>
    (await api.delete(`/messages/conversation/${conversationId}`)).data,
  clearConversation: async (conversationId: string) =>
    (await api.post(`/messages/conversation/${conversationId}/clear`)).data,
  unreadCount: async () => (await api.get<{ unreadCount: number }>('/messages/unread-count')).data,
  legacyNotifications: async () => (await api.get('/messages/notifications')).data,
  markLegacyNotificationRead: async (id: string) =>
    (await api.post(`/messages/notifications/${id}/read`)).data,
};
