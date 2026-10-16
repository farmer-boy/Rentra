import { useQuery } from '@tanstack/react-query';
import { contactsAPI } from '../api/contacts';
import { useAuthStore } from '../store/authStore';

export const useContactMessages = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN';
  const query = useQuery({
    queryKey: ['contactMessages'],
    queryFn: contactsAPI.list,
    enabled: Boolean(isAdmin),
    refetchInterval: isAdmin ? 5000 : false,
  });
  const messages = query.data ?? [];
  return {
    messages,
    unreadCount: messages.filter((message) => !message.read).length,
    loading: Boolean(isAdmin) && query.isPending,
    error: query.error,
    refetchMessages: query.refetch,
  };
};
