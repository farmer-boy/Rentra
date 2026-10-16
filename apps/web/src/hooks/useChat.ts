import { useCallback, useState } from 'react';
import { messagesAPI } from '../api/messages';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  createdAt: string;
  participant1: { id: string; fullName: string; email?: string };
  participant2: { id: string; fullName: string; email?: string };
  otherParticipant: { id: string; fullName: string; email?: string };
  lastMessage?: Message;
  listing?: { id: string; title: string; city: string; area: string } | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: { conversationId?: string; listingId?: string };
}

export const useChat = (initialConversation?: Conversation) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(initialConversation ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setConversations(await messagesAPI.conversations());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (conversationId: string, limit = 50, offset = 0) => {
      try {
        setMessages(await messagesAPI.messages(conversationId, limit, offset));
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    },
    [],
  );

  const startConversation = useCallback(
    async (otherUserId: string, listingId?: string) => {
      try {
        setLoading(true);
        const conversationRecord = await messagesAPI.getOrCreateConversation(
          otherUserId,
          listingId,
        );
        const conversation: Conversation = {
          ...conversationRecord,
          otherParticipant:
            conversationRecord.participant1Id === otherUserId
              ? conversationRecord.participant1
              : conversationRecord.participant2,
        };
        setCurrentConversation(conversation);
        await fetchMessages(conversation.id);
        return conversation;
      } catch (error) {
        console.error('Failed to start conversation:', error);
      } finally {
        setLoading(false);
      }
    },
    [fetchMessages],
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string, attachmentUrl?: string) => {
      const message = await messagesAPI.send(conversationId, {
        content,
        attachmentUrl,
      });
      setMessages((previous) => [...previous, message]);
      return message;
    },
    [],
  );

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await messagesAPI.unreadCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifications(await messagesAPI.legacyNotifications());
    } catch (error) {
      console.error('Failed to fetch message notifications:', error);
    }
  }, []);

  const markAsRead = useCallback(
    async (conversationId: string) => {
      try {
        await messagesAPI.markRead(conversationId);
        await fetchUnreadCount();
      } catch (error) {
        console.error('Failed to mark conversation as read:', error);
      }
    },
    [fetchUnreadCount],
  );

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    unreadCount,
    fetchConversations,
    startConversation,
    fetchMessages,
    sendMessage,
    fetchUnreadCount,
    notifications,
    fetchNotifications,
    markAsRead,
    setCurrentConversation,
  };
};
