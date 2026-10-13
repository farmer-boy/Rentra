import api from './client';

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  isRead: boolean;
  createdAt: string;
}

export const notificationsAPI = {
  list: async () => (await api.get<NotificationRecord[]>('/notifications')).data,
  markRead: async (id: string) =>
    (await api.patch<{ id: string; read: boolean }>(`/notifications/${id}/read`)).data,
  markAllRead: async () =>
    (await api.patch<{ updated: number }>('/notifications/read-all')).data,
};
