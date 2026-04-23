import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Mail, Trash2, ArrowLeft } from 'lucide-react';
import { useContactMessages } from '../../hooks/useContactMessages';

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

export default function AdminMessagesPage() {
  const { isDark } = useTheme();
  const { messages, unreadCount, refetchMessages } = useContactMessages();
  const [localMessages, setLocalMessages] = useState<ContactMessage[]>(messages);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const handleOpenMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);

    // If message is unread, mark it as read immediately (auto-seen like WhatsApp)
    if (!message.read) {
      try {
        await fetch(`http://localhost:3000/api/contact/message/${message.id}/read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Update local state
        setLocalMessages(
          localMessages.map(msg =>
            msg.id === message.id ? { ...msg, read: true } : msg
          )
        );
        setSelectedMessage({ ...message, read: true });

        // Refresh to update badge count immediately
        setTimeout(() => refetchMessages(), 100);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/contact/message/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setLocalMessages(localMessages.filter(msg => msg.id !== id));
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
        // Refresh messages to update badge count immediately
        setTimeout(() => refetchMessages(), 100);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

// Split View Layout - Fully Responsive (Mobile, Tablet/iPad, Desktop)
  return (
    <div className="flex h-full gap-2 lg:gap-4 overflow-hidden">
      {/* LEFT SIDE - Messages List Sidebar 
          Mobile: Hidden when message selected
          Tablet/iPad: Compact, always visible
          Desktop: Fixed width sidebar
      */}
      <div className={`${
        selectedMessage 
          ? 'hidden sm:flex' 
          : 'flex'
      } w-full sm:w-64 md:w-56 lg:w-80 flex-shrink-0 flex-col overflow-hidden`}>
        <div className="mb-3 lg:mb-4 flex-shrink-0 px-3 lg:px-4">
          <h2 className={`text-base lg:text-lg font-extrabold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
            <Mail size={18} className="lg:size-5" /> <span className="hidden sm:inline">Messages</span>
          </h2>
          <p className={`text-[10px] lg:text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
            {unreadCount} unread • {localMessages.length} total
          </p>
        </div>

        {localMessages.length === 0 ? (
          <div
            className="rounded-lg p-6 sm:p-4 lg:p-8 text-center mx-2 sm:mx-1 lg:mx-0"
            style={{
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
            }}
          >
            <Mail size={32} className="mx-auto mb-2 lg:mb-3 opacity-40 lg:size-10" />
            <p className={`text-xs lg:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No messages</p>
          </div>
        ) : (
          <div className="space-y-0.5 lg:space-y-1 overflow-y-auto flex-1 min-h-0 px-2 sm:px-1 lg:px-0">
            {localMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => handleOpenMessage(message)}
                className={`w-full text-left rounded-lg p-2 lg:p-3 border transition-all ${
                  selectedMessage?.id === message.id
                    ? isDark
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-green-50 border-green-500/50'
                    : 'hover:opacity-80 active:opacity-60'
                }`}
                style={{
                  backgroundColor:
                    selectedMessage?.id === message.id
                      ? isDark
                        ? '#0f3d0f'
                        : '#f0fdf4'
                      : message.read
                      ? isDark
                        ? '#0f0f0f'
                        : '#ffffff'
                      : isDark
                      ? '#1a1a1a'
                      : '#f0fdf4',
                  borderColor:
                    selectedMessage?.id === message.id
                      ? '#22c55e80'
                      : message.read
                      ? isDark
                        ? '#333333'
                        : '#e5e7eb'
                      : '#22c55e50',
                }}
              >
                <div className="flex items-start justify-between gap-1.5 lg:gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 lg:gap-2 mb-0.5 lg:mb-1">
                      <h3 className={`text-xs lg:text-sm ${!message.read ? 'font-bold' : 'font-semibold'} truncate ${isDark ? 'text-white' : 'text-black'}`}>
                        {message.name}
                      </h3>
                      {!message.read && (
                        <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#22c55e' }}></span>
                      )}
                    </div>
                    <p className={`text-[9px] lg:text-[10px] line-clamp-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {message.message}
                    </p>
                  </div>
                  <p className={`text-[9px] lg:text-[10px] whitespace-nowrap flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatDate(message.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDE - Message Detail 
          Mobile: Full-screen overlay when message selected
          Tablet/iPad: Show alongside sidebar (40% width)
          Desktop: Show alongside sidebar (flex-1)
      */}
      {selectedMessage && (
        <div
          className={`${
            selectedMessage ? 'flex' : 'hidden'
          } sm:flex flex-1 flex-col border rounded-lg overflow-hidden min-w-0 sm:rounded-lg sm:border sm:w-full md:w-auto fixed sm:static inset-0 sm:inset-auto z-50 sm:z-auto`}
          style={{
            backgroundColor: isDark ? '#0f0f0f' : '#ffffff',
            borderColor: isDark ? '#333' : '#e5e7eb',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between h-12 sm:h-14 px-3 sm:px-6 border-b flex-shrink-0"
            style={{
              backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
              borderColor: isDark ? '#333' : '#e5e7eb',
            }}
          >
            <button
              onClick={() => setSelectedMessage(null)}
              className="sm:hidden flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--text2)' }}
              title="Back to messages"
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className="text-xs sm:text-sm font-semibold flex-1 text-center sm:text-left px-2" style={{ color: 'var(--text)' }}>
              {selectedMessage.name}
            </h3>
            <button
              onClick={() => {
                handleDelete(selectedMessage.id);
                setSelectedMessage(null);
              }}
              className="p-1.5 sm:p-2 rounded hover:bg-red-500/20 transition-colors flex-shrink-0"
              style={{ color: '#ef4444' }}
              title="Delete message"
            >
              <Trash2 size={16} className="sm:size-4" />
            </button>
          </div>

          {/* Message Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 lg:space-y-4">
            {/* Sender Info */}
            <div
              className="rounded-lg p-3 lg:p-4"
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                borderColor: isDark ? '#333' : '#e5e7eb',
                border: '1px solid',
              }}
            >
              <p className="text-[10px] lg:text-[11px] font-semibold mb-1.5 lg:mb-2" style={{ color: 'var(--text2)' }}>
                FROM
              </p>
              <h4 className="text-xs lg:text-sm font-bold mb-2 lg:mb-4" style={{ color: 'var(--text)' }}>
                {selectedMessage.name}
              </h4>
              <div className="space-y-1.5 lg:space-y-2 text-[11px] lg:text-[13px]">
                <p style={{ color: 'var(--text2)' }}>
                  📧 <a href={`mailto:${selectedMessage.email}`} style={{ color: '#22c55e' }} className="hover:underline truncate">
                    {selectedMessage.email}
                  </a>
                </p>
                <p style={{ color: 'var(--text2)' }}>
                  📱 <a href={`tel:${selectedMessage.phone}`} style={{ color: '#22c55e' }} className="hover:underline">
                    {selectedMessage.phone}
                  </a>
                </p>
                <p style={{ color: 'var(--text2)' }}>
                  🕐 {formatDate(selectedMessage.createdAt)}
                </p>
              </div>
            </div>

            {/* Message Text */}
            <div
              className="rounded-lg p-3 lg:p-4"
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                borderColor: isDark ? '#333' : '#e5e7eb',
                border: '1px solid',
              }}
            >
              <p className="text-[10px] lg:text-[11px] font-semibold mb-2 lg:mb-3" style={{ color: 'var(--text2)' }}>
                MESSAGE
              </p>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                {selectedMessage.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

