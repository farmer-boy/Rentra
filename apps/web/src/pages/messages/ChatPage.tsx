import React, { useEffect, useState, useRef } from 'react';
import { Send, Search, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChat } from '../../hooks/useChat';

export default function ChatPage() {
  const { user } = useAuthStore();
  const token = useAuthStore((state) => state.token);
  const { user: authUser } = useAuthStore();

  const {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    fetchConversations,
    startConversation,
    fetchMessages,
    sendMessage,
    markAsRead,
    setCurrentConversation,
  } = useChat(token);

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
    if (token) {
      const timer = setInterval(() => {
        fetchConversations();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(timer);
    }
  }, [token, fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
      markAsRead(currentConversation.id);
    }
  }, [currentConversation, fetchMessages, markAsRead]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentConversation) return;

    setIsLoading(true);
    try {
      await sendMessage(currentConversation.id, messageInput);
      setMessageInput('');
      await fetchMessages(currentConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: any) => {
    setCurrentConversation(conversation);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherParticipant?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Conversations List */}
      <div className="w-80 border-r flex flex-col" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Messages
          </h1>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3"
              style={{ color: 'var(--text2)' }}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: 'var(--surface2)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center" style={{ color: 'var(--text2)' }}>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 border-b text-left transition-colors hover:opacity-80`}
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: currentConversation?.id === conv.id ? 'var(--surface2)' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {conv.otherParticipant?.fullName}
                  </h3>
                  <span className="text-xs" style={{ color: 'var(--text2)' }}>
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                {conv.lastMessage && (
                  <p className="text-xs truncate" style={{ color: 'var(--text2)' }}>
                    {conv.lastMessage.content}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  {currentConversation.otherParticipant?.fullName}
                </h2>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>
                  {currentConversation.otherParticipant?.email}
                </p>
              </div>
              <button
                onClick={() => setCurrentConversation(null)}
                className="p-2 rounded-lg hover:opacity-70"
                style={{ backgroundColor: 'var(--surface2)' }}
              >
                <X size={20} style={{ color: 'var(--text2)' }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full" style={{ color: 'var(--text2)' }}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === authUser?.id;
                  return (
                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg`}
                        style={{
                          backgroundColor: isOwn ? 'var(--green)' : 'var(--surface2)',
                          color: isOwn ? 'white' : 'var(--text)',
                        }}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t flex gap-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--surface2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !messageInput.trim()}
                className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--green)',
                  color: 'white',
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text2)' }}>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
