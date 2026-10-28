import React, { useCallback, useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArchiveRestore, ArrowLeft, Ban, Bell, BellOff, Check, CheckCheck, ChevronDown, ChevronUp, Copy, Info, ListChecks, Mail, MailOpen, MoreVertical, Pencil, Pin, Search, Send, Star, Trash2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useChat, type Conversation } from "../../hooks/useChat";
import { toApiError } from "../../api/api-error";
import { messagesAPI } from "../../api/messages";

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'favorites' | 'archived'>('all');
  const [openConversationMenuId, setOpenConversationMenuId] = useState<string | null>(null);
  const [showMuteOptionsForId, setShowMuteOptionsForId] = useState<string | null>(null);
  const [conversationMenuPosition, setConversationMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [conversationListWidth, setConversationListWidth] = useState(320);
  const [isResizingConversationList, setIsResizingConversationList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [conversationError, setConversationError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [messageNotice, setMessageNotice] = useState("");
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState("");
  const [messageActionLoading, setMessageActionLoading] = useState(false);
  const [chatHeaderMenuOpen, setChatHeaderMenuOpen] = useState(false);
  const [personInfoOpen, setPersonInfoOpen] = useState(false);
  const [isSelectingMessages, setIsSelectingMessages] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const conversationListRef = useRef<HTMLDivElement>(null);
  const chatHeaderMenuRef = useRef<HTMLDivElement>(null);
  const refocusComposerAfterSend = useRef(false);
  const notificationOpenedConversation = useRef<string | null>(null);
  const requestedConversationId = new URLSearchParams(location.search).get('conversationId');

  const returnToConversationList = useCallback(() => {
    setCurrentConversation(null);
    setChatHeaderMenuOpen(false);
    setPersonInfoOpen(false);
    setIsSelectingMessages(false);
    setSelectedMessageIds([]);
    setActiveMessageMenuId(null);
    if (location.search) navigate(location.pathname, { replace: true });
  }, [location.pathname, location.search, navigate, setCurrentConversation]);

  useEffect(() => {
    window.addEventListener('rentra:messages-back', returnToConversationList);
    return () => window.removeEventListener('rentra:messages-back', returnToConversationList);
  }, [returnToConversationList]);

  useEffect(() => {
    if (!openConversationMenuId) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-conversation-options]')) {
        setOpenConversationMenuId(null);
        setShowMuteOptionsForId(null);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [openConversationMenuId]);

  useEffect(() => {
    if (!chatHeaderMenuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !chatHeaderMenuRef.current?.contains(event.target)) setChatHeaderMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [chatHeaderMenuOpen]);

  const loadConversations = useCallback(async () => {
    setConversationLoading(true);
    try {
      const loadedConversations = await fetchConversations();
      if (requestedConversationId && notificationOpenedConversation.current !== requestedConversationId) {
        const target = loadedConversations?.find((conversation: Conversation) => conversation.id === requestedConversationId);
        if (target) {
          notificationOpenedConversation.current = requestedConversationId;
          setCurrentConversation(target);
        }
      }
      setConversationError("");
    } catch (error: unknown) {
      setConversationError(toApiError(error).message || "Conversations could not be loaded.");
    } finally {
      setConversationLoading(false);
    }
  }, [fetchConversations, requestedConversationId, setCurrentConversation]);

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
      const refreshMessages = () => {
        void fetchMessages(currentConversation.id).then(() =>
          queryClient.invalidateQueries({ queryKey: ['unreadMessages', authUser?.id] }),
        );
      };
      refreshMessages();
      void markAsRead(currentConversation.id).then(() => fetchConversations());
      const timer = setInterval(() => {
        refreshMessages();
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [currentConversation, fetchMessages, markAsRead, fetchConversations, queryClient, authUser?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isLoading || !refocusComposerAfterSend.current) return;
    refocusComposerAfterSend.current = false;
    messageInputRef.current?.focus();
  }, [isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || (!messageInput.trim() && !attachmentUrl.trim()) || !currentConversation)
      return;

    refocusComposerAfterSend.current = true;
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

  const selectedMessages = messages.filter((message) => selectedMessageIds.includes(message.id));
  const copySelectedMessages = async () => {
    const content = selectedMessages.map((message) => message.content || message.attachmentUrl || '').filter(Boolean).join('\n');
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setMessageNotice(`${selectedMessages.length} selected message${selectedMessages.length === 1 ? '' : 's'} copied.`);
      setMessageError('');
      setIsSelectingMessages(false);
      setSelectedMessageIds([]);
    } catch {
      setMessageError('Selected messages could not be copied.');
    }
  };
  const deleteSelectedMessages = async () => {
    if (!currentConversation) return;
    const ownMessages = selectedMessages.filter((message) => message.senderId === authUser?.id);
    if (!ownMessages.length) {
      setMessageError('You can only delete your own messages.');
      return;
    }
    if (!window.confirm(`Delete ${ownMessages.length} selected message${ownMessages.length === 1 ? '' : 's'}?`)) return;
    setMessageActionLoading(true);
    try {
      for (const message of ownMessages) await deleteMessage(currentConversation.id, message.id);
      setSelectedMessageIds([]);
      setIsSelectingMessages(false);
      await fetchConversations();
      setMessageError('');
      setMessageNotice('Selected messages deleted.');
    } catch (error: unknown) {
      setMessageError(toApiError(error).message || 'Selected messages could not be deleted.');
    } finally {
      setMessageActionLoading(false);
    }
  };
  const starSelectedMessages = async () => {
    if (!currentConversation || !selectedMessages.length) return;
    setMessageActionLoading(true);
    try {
      await Promise.all(selectedMessages.map((message) => messagesAPI.star(currentConversation.id, message.id, true)));
      await fetchMessages(currentConversation.id);
      setSelectedMessageIds([]);
      setIsSelectingMessages(false);
      setMessageError('');
      setMessageNotice('Selected messages starred.');
    } catch (error: unknown) {
      setMessageError(toApiError(error).message || 'Selected messages could not be starred.');
    } finally {
      setMessageActionLoading(false);
    }
  };

  const filteredConversations = conversations
    .filter((conv) => conversationFilter === 'archived' ? Boolean(conv.isArchived) : !conv.isArchived)
    .filter((conv) => conversationFilter !== 'unread' || Boolean(conv.unreadCount))
    .filter((conv) => conversationFilter !== 'favorites' || Boolean(conv.isFavorite))
    .filter((conv) => conv.otherParticipant?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
  const officialNoticeChat = Boolean(currentConversation?.otherParticipant?.roles?.includes('ADMIN'));

  const refreshConversationList = async () => {
    await fetchConversations();
    await queryClient.invalidateQueries({ queryKey: ['unreadMessages', authUser?.id] });
  };
  const closeConversationIfSelected = (conversationId: string) => {
    if (currentConversation?.id === conversationId) setCurrentConversation(null);
  };
  const toggleConversationRead = async (conversation: Conversation) => {
    try {
      if (conversation.unreadCount) {
        await messagesAPI.markRead(conversation.id);
      } else {
        await messagesAPI.markUnread(conversation.id);
        closeConversationIfSelected(conversation.id);
      }
      setOpenConversationMenuId(null);
      await refreshConversationList();
    } catch {
      setConversationError('Conversation read status could not be updated.');
    }
  };
  const toggleConversationArchive = async (conversation: Conversation) => {
    try {
      if (conversation.isArchived) await messagesAPI.unarchive(conversation.id);
      else {
        await messagesAPI.archive(conversation.id);
        closeConversationIfSelected(conversation.id);
      }
      setOpenConversationMenuId(null);
      await refreshConversationList();
    } catch {
      setConversationError('Conversation could not be archived.');
    }
  };
  const toggleConversationFavorite = async (conversation: Conversation) => {
    try {
      await messagesAPI.favorite(conversation.id, !conversation.isFavorite);
      setOpenConversationMenuId(null);
      await refreshConversationList();
    } catch {
      setConversationError('Favorite status could not be updated.');
    }
  };
  const toggleConversationPin = async (conversation: Conversation) => {
    try {
      await messagesAPI.pin(conversation.id, !conversation.isPinned);
      setOpenConversationMenuId(null);
      await refreshConversationList();
    } catch {
      setConversationError('Pin status could not be updated.');
    }
  };
  const toggleConversationBlock = async (conversation: Conversation) => {
    const action = conversation.isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} ${conversation.otherParticipant?.fullName || 'this user'}?`)) return;
    try {
      await messagesAPI.block(conversation.id, !conversation.isBlocked);
      setOpenConversationMenuId(null);
      if (!conversation.isBlocked) closeConversationIfSelected(conversation.id);
      await refreshConversationList();
    } catch {
      setConversationError(`User could not be ${action}ed.`);
    }
  };
  const muteConversation = async (conversationId: string, duration: number | 'always') => {
    try {
      await messagesAPI.mute(conversationId, duration);
      setOpenConversationMenuId(null);
      setShowMuteOptionsForId(null);
      await refreshConversationList();
    } catch {
      setConversationError('Notifications could not be muted.');
    }
  };
  const unmuteConversation = async (conversationId: string) => {
    try {
      await messagesAPI.unmute(conversationId);
      setOpenConversationMenuId(null);
      await refreshConversationList();
    } catch {
      setConversationError('Notifications could not be unmuted.');
    }
  };
  const resizeConversationList = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingConversationList || !conversationListRef.current) return;
    const left = conversationListRef.current.getBoundingClientRect().left;
    setConversationListWidth(Math.max(260, Math.min(520, event.clientX - left)));
  };
  const toggleConversationMenu = (conversationId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openConversationMenuId === conversationId) {
      setOpenConversationMenuId(null);
      setShowMuteOptionsForId(null);
      return;
    }
    const sidebar = conversationListRef.current?.getBoundingClientRect();
    const trigger = event.currentTarget.getBoundingClientRect();
    const left = sidebar ? sidebar.left + sidebar.width * 0.9 : trigger.right;
    const top = Math.min(Math.max(8, trigger.top), Math.max(8, window.innerHeight - 340));
    setConversationMenuPosition({ left: Math.min(left, window.innerWidth - 205), top });
    setOpenConversationMenuId(conversationId);
    setShowMuteOptionsForId(null);
  };
  const deleteConversation = async (conversationId: string) => {
    if (!window.confirm('Delete this chat from your inbox?')) return;
    try {
      await messagesAPI.deleteConversation(conversationId);
      setOpenConversationMenuId(null);
      closeConversationIfSelected(conversationId);
      await refreshConversationList();
    } catch {
      setConversationError('Conversation could not be deleted.');
    }
  };
  const clearConversation = async (conversationId: string) => {
    if (!window.confirm('Clear all messages in this chat? The chat itself will remain in your inbox.')) return;
    try {
      await messagesAPI.clearConversation(conversationId);
      setOpenConversationMenuId(null);
      if (currentConversation?.id === conversationId) await fetchMessages(conversationId);
      await refreshConversationList();
    } catch {
      setConversationError('Messages could not be cleared.');
    }
  };

  return (
    <div
      className="flex h-[calc(100dvh-5rem)] min-h-[24rem] w-full min-w-0 overflow-hidden sm:h-[calc(100dvh-5.5rem)] lg:h-[calc(100dvh-6.5rem)]"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Conversations List */}
      <div
        ref={conversationListRef}
        className={`${currentConversation ? "hidden lg:flex" : "flex"} relative w-full shrink-0 flex-col border-r lg:w-[var(--conversation-list-width)]`}
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          '--conversation-list-width': `${conversationListWidth}px`,
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold">
              <button type="button" onClick={() => { setCurrentConversation(null); setChatHeaderMenuOpen(false); setPersonInfoOpen(false); setIsSelectingMessages(false); setSelectedMessageIds([]); setActiveMessageMenuId(null); }} className="rounded-md text-left hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" style={{ color: "var(--text)" }} aria-label="Close open chat and show all messages">
                Messages
              </button>
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
          <div className="mt-3 flex gap-1 overflow-x-auto" role="tablist" aria-label="Conversation filters">
            {([{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'favorites', label: 'Favorites' }, { id: 'archived', label: 'Archived' }] as const).map((filter) => <button key={filter.id} type="button" role="tab" aria-selected={conversationFilter === filter.id} onClick={() => setConversationFilter(filter.id)} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${conversationFilter === filter.id ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface2"}`}>{filter.label}</button>)}
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
              <div key={conv.id} className={`group relative border-b ${openConversationMenuId === conv.id ? "z-20" : ""}`} style={{ borderColor: "var(--border)", backgroundColor: currentConversation?.id === conv.id || conv.unreadCount ? "var(--surface2)" : "transparent" }}>
                <button
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 pr-12 text-left transition-colors hover:opacity-80 ${conv.unreadCount ? "font-bold" : "font-normal"}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className={`flex min-w-0 items-center gap-1.5 truncate text-sm ${conv.unreadCount ? "font-extrabold" : "font-semibold"}`} style={{ color: "var(--text)" }}>
                      <span className="truncate">{conv.otherParticipant?.roles?.includes('ADMIN') ? 'Rentra Support' : conv.otherParticipant?.fullName}</span>
                      {conv.isMuted && <BellOff size={13} className="shrink-0 text-text-muted" aria-label="Notifications muted" />}
                    </h3>
                    <span className={`shrink-0 text-xs ${conv.unreadCount ? "font-bold" : "font-normal"}`} style={{ color: "var(--text2)" }}>
                      {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </span>
                  </div>
                  {conv.listing && <p className={`truncate text-[10px] text-emerald-600 ${conv.unreadCount ? "font-bold" : "font-normal"}`}>{conv.listing.title} · {conv.listing.area}, {conv.listing.city}</p>}
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className={`min-w-0 flex-1 truncate text-xs ${conv.unreadCount ? "font-bold" : "font-normal"}`} style={{ color: "var(--text2)" }}>
                      {conv.lastMessage?.content || (conv.lastMessage?.attachmentUrl ? "Photo" : "No messages yet")}
                    </p>
                    {!!conv.unreadCount && <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: "#dc2626" }} aria-label={`${conv.unreadCount} unread messages`} title={`${conv.unreadCount} unread messages`}>{conv.unreadCount}</span>}
                  </div>
                </button>
                <div data-conversation-options className="contents">
                  <button
                    type="button"
                    onClick={(event) => toggleConversationMenu(conv.id, event)}
                    title="Chat options"
                    aria-label="Chat options"
                    aria-expanded={openConversationMenuId === conv.id}
                    className={`absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-surface p-1.5 text-text-muted shadow-sm transition-opacity hover:text-primary ${openConversationMenuId === conv.id ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"}`}
                  >
                    <ChevronUp size={17} />
                  </button>
                  {openConversationMenuId === conv.id && <div className="fixed z-30 w-48 overflow-visible rounded-xl border border-border bg-surface py-1 shadow-xl" style={{ left: conversationMenuPosition?.left, top: conversationMenuPosition?.top }}>
                  <button type="button" onClick={() => void toggleConversationRead(conv)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface2">
                    {conv.unreadCount ? <MailOpen size={15} /> : <Mail size={15} />}{conv.unreadCount ? "Mark as read" : "Mark as unread"}
                  </button>
                  <button type="button" onClick={() => void toggleConversationFavorite(conv)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface2">
                    <Star size={15} className={conv.isFavorite ? "fill-amber-400 text-amber-500" : ""} />{conv.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  </button>
                  <button type="button" onClick={() => void toggleConversationPin(conv)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface2">
                    <Pin size={15} className={conv.isPinned ? "fill-current" : ""} />{conv.isPinned ? "Unpin chat" : "Pin chat"}
                  </button>
                  {conv.isMuted && <p className="px-3 py-1 text-[10px] text-text-muted">Muted {conv.mutedUntil ? `until ${new Date(conv.mutedUntil).toLocaleString()}` : 'always'}</p>}
                  <div className="group/mute relative">
                    <button type="button" onClick={() => setShowMuteOptionsForId(showMuteOptionsForId === conv.id ? null : conv.id)} aria-expanded={showMuteOptionsForId === conv.id} className="flex w-full items-center justify-between gap-2 border-t border-border px-3 py-2 text-left text-xs text-text hover:bg-surface2">
                      <span className="inline-flex items-center gap-2"><BellOff size={15} /> Mute notifications</span><ChevronDown size={14} />
                    </button>
                    <div className={`absolute left-[calc(100%-1px)] top-0 z-40 w-32 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl ${showMuteOptionsForId === conv.id ? "block" : "hidden group-hover/mute:block group-focus-within/mute:block"}`}>
                      {[{ duration: 1, label: '1 hour' }, { duration: 8, label: '8 hours' }, { duration: 24, label: '1 day' }, { duration: 168, label: '1 week' }, { duration: 'always' as const, label: 'Always' }].map((option) => <button key={option.label} type="button" onClick={() => void muteConversation(conv.id, option.duration)} className="block w-full px-3 py-2 text-left text-xs text-text hover:bg-surface2">{option.label}</button>)}
                    </div>
                  </div>
                  {conv.isMuted && <button type="button" onClick={() => void unmuteConversation(conv.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface2"><Bell size={15} />Unmute notifications</button>}
                  <button type="button" onClick={() => void toggleConversationArchive(conv)} className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs text-text hover:bg-surface2">
                    {conv.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}{conv.isArchived ? "Move to inbox" : "Archive chat"}
                  </button>
                  <button type="button" onClick={() => void toggleConversationBlock(conv)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"><Ban size={15} />{conv.isBlocked ? "Unblock chat" : "Block chat"}</button>
                  <button type="button" onClick={() => void clearConversation(conv.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface2"><Trash2 size={15} />Clear chat</button>
                  <button type="button" onClick={() => void deleteConversation(conv.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"><Trash2 size={15} />Delete chat</button>
                  </div>}
                </div>
              </div>
            ))
          )}
        </div>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize conversation list"
          title="Drag to resize the conversation list"
          onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setIsResizingConversationList(true); }}
          onPointerMove={resizeConversationList}
          onPointerUp={() => setIsResizingConversationList(false)}
          onPointerCancel={() => setIsResizingConversationList(false)}
          className={`absolute -right-1 top-0 z-20 hidden h-full w-2 touch-none cursor-col-resize lg:block ${isResizingConversationList ? "bg-primary/40" : "hover:bg-primary/25"}`}
        />
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
              <div className="flex min-w-0 items-center gap-2">
                <button type="button" onClick={returnToConversationList} className="shrink-0 rounded-lg p-2 hover:bg-surface2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label="Back to conversations" title="Back to conversations">
                  <ArrowLeft size={20} style={{ color: "var(--text2)" }} />
                </button>
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
              </div>
              <div className="relative" ref={chatHeaderMenuRef}>
                <button type="button" onClick={() => setChatHeaderMenuOpen((open) => !open)} className="rounded-lg p-2 hover:bg-surface2" aria-label="Chat options" aria-expanded={chatHeaderMenuOpen}>
                  <MoreVertical size={20} style={{ color: "var(--text2)" }} />
                </button>
                {chatHeaderMenuOpen && <div className="absolute right-0 top-full z-40 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl">
                  <button type="button" onClick={() => { setPersonInfoOpen(true); setChatHeaderMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-surface2"><Info size={16} />Person info</button>
                  <button type="button" onClick={() => { setIsSelectingMessages((value) => !value); setSelectedMessageIds([]); setChatHeaderMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-surface2"><ListChecks size={16} />{isSelectingMessages ? 'Cancel selection' : 'Select messages'}</button>
                  <button type="button" onClick={() => { void toggleConversationFavorite(currentConversation); setChatHeaderMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-surface2"><Star size={16} className={currentConversation.isFavorite ? 'fill-amber-400 text-amber-500' : ''} />{currentConversation.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</button>
                  <button type="button" onClick={() => { setCurrentConversation(null); setChatHeaderMenuOpen(false); setIsSelectingMessages(false); setSelectedMessageIds([]); }} className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm text-text hover:bg-surface2"><X size={16} />Close chat</button>
                  <button type="button" onClick={() => { void clearConversation(currentConversation.id); setChatHeaderMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-surface2"><Trash2 size={16} />Clear chat</button>
                  <button type="button" onClick={() => { void deleteConversation(currentConversation.id); setChatHeaderMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"><Trash2 size={16} />Delete chat</button>
                </div>}
              </div>
            </div>

            {personInfoOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPersonInfoOpen(false); }}>
              <section role="dialog" aria-modal="true" aria-labelledby="person-info-title" className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between"><h3 id="person-info-title" className="text-lg font-semibold text-text">Person info</h3><button type="button" onClick={() => setPersonInfoOpen(false)} aria-label="Close person info" className="rounded-lg p-2 hover:bg-surface2"><X size={18} /></button></div>
                <dl className="space-y-3 text-sm"><div><dt className="text-text-muted">Name</dt><dd className="font-medium text-text">{currentConversation.otherParticipant?.fullName}</dd></div><div><dt className="text-text-muted">Email</dt><dd className="break-all font-medium text-text">{currentConversation.otherParticipant?.email || 'Not available'}</dd></div>{currentConversation.listing && <div><dt className="text-text-muted">Listing</dt><dd className="font-medium text-text">{currentConversation.listing.title} · {currentConversation.listing.area}, {currentConversation.listing.city}</dd></div>}</dl>
              </section>
            </div>}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messageError && <p role="alert" className="text-sm text-red-600">{messageError}</p>}
              {messageNotice && <p role="status" className="text-sm text-emerald-600">{messageNotice}</p>}
              {isSelectingMessages && <p className="sticky top-0 z-10 rounded-lg bg-surface2 px-3 py-2 text-xs font-semibold text-text">{selectedMessageIds.length} message{selectedMessageIds.length === 1 ? '' : 's'} selected</p>}
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
                      className={`group flex items-center gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                      onMouseLeave={() => {
                        if (activeMessageMenuId === message.id) setActiveMessageMenuId(null);
                      }}
                    >
                      {isSelectingMessages && <input type="checkbox" checked={selectedMessageIds.includes(message.id)} onChange={(event) => setSelectedMessageIds((ids) => event.target.checked ? [...ids, message.id] : ids.filter((id) => id !== message.id))} aria-label={`Select message from ${message.sender.fullName}`} className="h-4 w-4 shrink-0 accent-primary" />}
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
                            {message.isStarred && <Star size={12} className="ml-1 inline-block fill-amber-400 text-amber-500" aria-label="Starred message" />}
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

            {isSelectingMessages && selectedMessages.length > 0 && <div className="flex items-center justify-between gap-3 border-t px-4 py-2 shadow-lg" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <span className="text-xs font-semibold text-text">{selectedMessages.length} selected</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void copySelectedMessages()} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-text hover:bg-surface2"><Copy size={15} />Copy</button>
                <button type="button" onClick={() => void deleteSelectedMessages()} disabled={messageActionLoading || !selectedMessages.some((message) => message.senderId === authUser?.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 size={15} />Delete</button>
                <button type="button" onClick={() => void starSelectedMessages()} disabled={messageActionLoading} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-text hover:bg-surface2 disabled:opacity-40"><Star size={15} />Star</button>
              </div>
            </div>}

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
                readOnly={isLoading}
                className={`min-w-0 flex-1 px-4 py-2 rounded-lg border text-sm ${isLoading ? "opacity-70" : ""}`}
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
