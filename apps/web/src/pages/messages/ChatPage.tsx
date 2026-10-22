import React, { useCallback, useEffect, useState, useRef } from "react";
import { ArrowLeft, Check, CheckCheck, ChevronUp, Copy, Pencil, Search, Send, Trash2, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useChat, type Conversation } from "../../hooks/useChat";
import { toApiError } from "../../api/api-error";

export default function ChatPage() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token) || "";
  const incomingConversation = (location.state as { conversation?: Conversation } | null)?.conversation;

  const {
    conversations,
    currentConversation,
    messages,
    fetchConversations,
    fetchMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    setCurrentConversation,
    notifications,
    fetchNotifications,
    fetchUnreadCount,
    loading: chatLoading,
  } = useChat(incomingConversation);
  const { user: authUser } = useAuthStore();

  const [messageInput, setMessageInput] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [conversationError, setConversationError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [messageNotice, setMessageNotice] = useState("");
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState("");
  const [messageActionLoading, setMessageActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const loadConversations = useCallback(async () => {
    setConversationLoading(true);
    try {
      await fetchConversations();
      setConversationError("");
    } catch (error: unknown) {
      setConversationError(toApiError(error).message || "Conversations could not be loaded.");
    } finally {
      setConversationLoading(false);
    }
  }, [fetchConversations]);

  // Fetch conversations on mount
  useEffect(() => {
    void loadConversations();
    fetchNotifications();
    fetchUnreadCount();
    if (token) {
      const timer = setInterval(() => {
        void loadConversations();
        fetchNotifications();
        fetchUnreadCount();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(timer);
    }
  }, [token, loadConversations, fetchNotifications, fetchUnreadCount]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
      void markAsRead(currentConversation.id).then(() => fetchConversations());
      const timer = setInterval(() => {
        fetchMessages(currentConversation.id);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [currentConversation, fetchMessages, markAsRead, fetchConversations]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !attachmentUrl.trim()) || !currentConversation)
      return;

    setIsLoading(true);
    try {
      await sendMessage(
        currentConversation.id,
        messageInput,
        attachmentUrl || undefined,
      );
      setMessageInput("");
      setAttachmentUrl("");
      await fetchMessages(currentConversation.id);
      setMessageError("");
      requestAnimationFrame(() => messageInputRef.current?.focus());
    } catch {
      setMessageError("Message could not be sent. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const handleCopyMessage = async (content: string, attachmentUrl?: string) => {
    const text = content || attachmentUrl || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessageNotice("Message copied.");
      setMessageError("");
    } catch {
      setMessageError("Could not copy this message.");
      setMessageNotice("");
    }
    setActiveMessageMenuId(null);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentConversation || !editingMessageId || !editingMessageContent.trim()) return;
    setMessageActionLoading(true);
    try {
      await updateMessage(currentConversation.id, editingMessageId, editingMessageContent.trim());
      await fetchConversations();
      setEditingMessageId(null);
      setEditingMessageContent("");
      setMessageError("");
      setMessageNotice("");
    } catch (error: unknown) {
      setMessageError(toApiError(error).message || "Message could not be edited.");
    } finally {
      setMessageActionLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentConversation || !window.confirm("Delete this message for everyone in the conversation?")) return;
    setMessageActionLoading(true);
    try {
      await deleteMessage(currentConversation.id, messageId);
      await fetchConversations();
      setActiveMessageMenuId(null);
      setMessageError("");
      setMessageNotice("");
    } catch (error: unknown) {
      setMessageError(toApiError(error).message || "Message could not be deleted.");
    } finally {
      setMessageActionLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherParticipant?.fullName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );
  const officialNoticeChat = Boolean(currentConversation?.otherParticipant?.roles?.includes('ADMIN'));

  return (
    <div
      className="flex h-[calc(100dvh-5rem)] min-h-[24rem] w-full min-w-0 overflow-hidden sm:h-[calc(100dvh-5.5rem)] lg:h-[calc(100dvh-6.5rem)]"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Conversations List */}
      <div
        className={`${currentConversation ? "hidden lg:flex" : "flex"} w-full shrink-0 flex-col border-r lg:w-80`}
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h1
              className="text-lg font-semibold"
              style={{ color: "var(--text)" }}
            >
              Messages
            </h1>
            {notifications.some((notification) => !notification.isRead) && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-contrast">
                New
              </span>
            )}
          </div>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3"
              style={{ color: "var(--text2)" }}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: "var(--surface2)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversationLoading && conversations.length === 0 ? (
            <div className="p-4 text-center" style={{ color: "var(--text2)" }}><p className="text-sm">Loading conversations...</p></div>
          ) : conversationError && conversations.length === 0 ? (
            <div role="alert" className="p-4 text-center text-sm text-red-600">{conversationError}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center" style={{ color: "var(--text2)" }}>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-4 border-b text-left transition-colors hover:opacity-80 ${conv.unreadCount ? "font-bold" : "font-normal"}`}
                style={{
                  borderColor: "var(--border)",
                  backgroundColor:
                    currentConversation?.id === conv.id
                      ? "var(--surface2)"
                      : conv.unreadCount
                        ? "var(--surface2)"
                      : "transparent",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={`min-w-0 truncate text-sm ${conv.unreadCount ? "font-extrabold" : "font-semibold"}`}
                    style={{ color: "var(--text)" }}
                  >
                    {conv.otherParticipant?.roles?.includes('ADMIN') ? 'Rentra Support' : conv.otherParticipant?.fullName}
                  </h3>
                  <span className={`shrink-0 text-xs ${conv.unreadCount ? "font-bold" : "font-normal"}`} style={{ color: "var(--text2)" }}>
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                {conv.listing && (
                    <p className={`truncate text-[10px] text-emerald-600 ${conv.unreadCount ? "font-bold" : "font-normal"}`}>
                    {conv.listing.title} · {conv.listing.area},{" "}
                    {conv.listing.city}
                  </p>
                )}
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <p
                    className={`min-w-0 flex-1 truncate text-xs ${conv.unreadCount ? "font-bold" : "font-normal"}`}
                    style={{ color: "var(--text2)" }}
                  >
                    {conv.lastMessage?.content || (conv.lastMessage?.attachmentUrl ? "Photo" : "No messages yet")}
                  </p>
                  {!!conv.unreadCount && (
                    <span
                      className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: "#dc2626" }}
                      aria-label={`${conv.unreadCount} unread messages`}
                      title={`${conv.unreadCount} unread messages`}
                    >
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${currentConversation ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col`}>
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="min-w-0">
                <h2
                  className="truncate text-lg font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {officialNoticeChat ? "Rentra Support" : currentConversation.otherParticipant?.fullName}
                </h2>
                <p className="truncate text-xs" style={{ color: "var(--text2)" }}>
                  {currentConversation.otherParticipant?.email}
                </p>
                {currentConversation.listing && (
                  <p className="truncate text-xs text-emerald-600">
                    {currentConversation.listing.title} ·{" "}
                    {currentConversation.listing.area},{" "}
                    {currentConversation.listing.city}
                  </p>
                )}
              </div>
              <button
                onClick={() => setCurrentConversation(null)}
                className="p-2 rounded-lg hover:opacity-70"
                style={{ backgroundColor: "var(--surface2)" }}
                aria-label="Back to conversations"
                title="Back to conversations"
              >
                <ArrowLeft className="lg:hidden" size={20} style={{ color: "var(--text2)" }} />
                <X className="hidden lg:block" size={20} style={{ color: "var(--text2)" }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messageError && <p role="alert" className="text-sm text-red-600">{messageError}</p>}
              {messageNotice && <p role="status" className="text-sm text-emerald-600">{messageNotice}</p>}
              {chatLoading && messages.length === 0 && <p className="text-center text-sm" style={{ color: "var(--text2)" }}>Loading messages...</p>}
              {messages.length === 0 ? (
                <div
                  className="flex items-center justify-center h-full"
                  style={{ color: "var(--text2)" }}
                >
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === authUser?.id;
                  return (
                    <div
                      key={message.id}
                      className={`group flex ${isOwn ? "justify-end" : "justify-start"}`}
                      onMouseLeave={() => {
                        if (activeMessageMenuId === message.id) setActiveMessageMenuId(null);
                      }}
                    >
                      <div
                        className="relative max-w-xs rounded-lg px-4 py-2 lg:max-w-md"
                        style={{
                          backgroundColor: isOwn
                            ? "var(--green)"
                            : "var(--surface2)",
                          color: isOwn
                            ? "rgb(var(--rentra-primary-contrast))"
                            : "var(--text)",
                        }}
                      >
                        {activeMessageMenuId === message.id && (
                          <div className="absolute bottom-0 right-0 z-20 min-w-36 overflow-hidden rounded-lg border py-1 shadow-lg" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
                            <button type="button" onClick={() => void handleCopyMessage(message.content, message.attachmentUrl)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--surface2)]">
                              <Copy size={14} /> Copy
                            </button>
                            {isOwn && message.content && (
                              <button type="button" onClick={() => { setEditingMessageId(message.id); setEditingMessageContent(message.content); setActiveMessageMenuId(null); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--surface2)]">
                                <Pencil size={14} /> Edit
                              </button>
                            )}
                            {isOwn && (
                              <button type="button" disabled={messageActionLoading} onClick={() => void handleDeleteMessage(message.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </div>
                        )}
                        {message.attachmentUrl && (
                          <img
                            src={message.attachmentUrl}
                            alt="Message attachment"
                            className="mb-2 max-h-48 rounded object-cover"
                          />
                        )}
                        {editingMessageId === message.id ? (
                          <form onSubmit={(event) => void handleSaveEdit(event)} className="flex gap-1">
                            <input
                              autoFocus
                              value={editingMessageContent}
                              onChange={(event) => setEditingMessageContent(event.target.value)}
                              maxLength={5000}
                              className="min-w-0 flex-1 rounded border px-2 py-1 text-sm"
                              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                              aria-label="Edit message"
                            />
                            <button type="submit" disabled={messageActionLoading || !editingMessageContent.trim()} className="rounded p-1 disabled:opacity-50" aria-label="Save edited message"><Check size={16} /></button>
                            <button type="button" onClick={() => { setEditingMessageId(null); setEditingMessageContent(""); }} className="rounded p-1" aria-label="Cancel editing"><X size={16} /></button>
                          </form>
                        ) : (
                          <p className="text-sm break-words">
                            {message.content}
                            <span className="ml-2 inline-flex items-center gap-0.5 whitespace-nowrap align-baseline text-[11px] opacity-75">
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              {isOwn && (
                                <span
                                  className={message.isRead ? "text-sky-300" : "opacity-80"}
                                  title={message.isRead ? "Seen" : message.isDelivered ? "Delivered" : "Sent"}
                                  aria-label={message.isRead ? "Seen" : message.isDelivered ? "Delivered" : "Sent"}
                                >
                                  {message.isDelivered ? <CheckCheck size={15} /> : <Check size={15} />}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setActiveMessageMenuId(activeMessageMenuId === message.id ? null : message.id)}
                                className={`-mr-1 rounded-full p-0.5 transition-opacity hover:bg-black/10 focus:opacity-100 ${activeMessageMenuId === message.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                aria-label="Message actions"
                                title="Message actions"
                              >
                                <ChevronUp size={14} />
                              </button>
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {officialNoticeChat ? <div className="border-t p-4 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>Official notices from Rentra Support. Replies are disabled.</div> : <form
              onSubmit={handleSendMessage}
              className="p-4 border-t flex gap-2"
              style={{ borderColor: "var(--border)" }}
            >
              <input
                ref={messageInputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                disabled={isLoading}
                className="min-w-0 flex-1 px-4 py-2 rounded-lg border text-sm disabled:opacity-50"
                style={{
                  backgroundColor: "var(--surface2)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="Image URL"
                className="w-24 shrink-0 px-2 py-2 rounded-lg border text-xs sm:w-32"
                style={{
                  backgroundColor: "var(--surface2)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !messageInput.trim()}
                className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
                style={{
                  backgroundColor: "var(--green)",
                  color: "rgb(var(--rentra-primary-contrast))",
                }}
              >
                <Send size={18} />
              </button>
            </form>}
          </>
        ) : (
          <div
            className="flex-1 flex items-center justify-center"
            style={{ color: "var(--text2)" }}
          >
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
