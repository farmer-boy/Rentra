import { useState, useEffect } from 'react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  read: boolean;
  createdAt: string;
}

export const useContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/contact/messages');
      const data = await response.json();
      
      if (data && Array.isArray(data.data)) {
        setMessages(data.data);
        const unread = data.data.filter((msg: ContactMessage) => !msg.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch contact messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, []);

  return { messages, unreadCount, loading, refetchMessages: fetchMessages };
};
