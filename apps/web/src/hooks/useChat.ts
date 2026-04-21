import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  createdAt: string;
  participant1: { id: string; fullName: string; email: string };
  participant2: { id: string; fullName: string; email: string };
  otherParticipant: { id: string; fullName: string; email: string };
  lastMessage?: Message;
}

export const useChat = (token?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Get all conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  // Get or create conversation with a user
  const startConversation = useCallback(
    async (otherUserId: string, listingId?: string) => {
      try {
        setLoading(true);
        const response = await axiosInstance.post(
          `/messages/conversation/${otherUserId}`,
          {},
          { params: { listingId } },
        );
        setCurrentConversation(response.data);
        await fetchMessages(response.data.id);
        return response.data;
      } catch (error) {
        console.error('Failed to start conversation:', error);
      } finally {
        setLoading(false);
      }
    },
    [axiosInstance],
  );

  // Get messages in conversation
  const fetchMessages = useCallback(
    async (conversationId: string, limit = 50, offset = 0) => {
      try {
        const response = await axiosInstance.get(
          `/messages/conversation/${conversationId}`,
          { params: { limit, offset } },
        );
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    },
    [axiosInstance],
  );

  // Send a message
  const sendMessage = useCallback(
    async (conversationId: string, content: string, attachmentUrl?: string) => {
      try {
        const response = await axiosInstance.post(
          `/messages/conversation/${conversationId}/send`,
          { content, attachmentUrl },
        );
        setMessages((prev) => [...prev, response.data]);
        return response.data;
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [axiosInstance],
  );

  // Get unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/messages/unread-count');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [axiosInstance]);

  // Mark conversation as read
  const markAsRead = useCallback(
    async (conversationId: string) => {
      try {
        await axiosInstance.post(`/messages/conversation/${conversationId}/read`);
        await fetchUnreadCount();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    },
    [axiosInstance, fetchUnreadCount],
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
    markAsRead,
    setCurrentConversation,
  };
};
