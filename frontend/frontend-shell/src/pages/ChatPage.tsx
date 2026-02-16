import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { MessageList } from '../components/chat/MessageList';
import { MessageComposer } from '../components/chat/MessageComposer';
import { ChatHeader } from '../components/chat/ChatHeader';
import { useChatStore } from '../stores/chat.store';
import { useAuthStore } from '../stores/auth.store';
import { useWebSocket } from '../providers/WebSocketProvider';
import { apiService } from '../services/api.service';
import { Chat } from '../types';
import {
  Search,
  Plus,
  MessageSquare,
  X,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    chats,
    activeChat,
    setChats,
    setActiveChat,
    setMessages,
    setLoading,
    isLoading,
    searchQuery,
    setSearchQuery,
  } = useChatStore();
  const { joinChat, leaveChat, typingUsers, isConnected } = useWebSocket();

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true);
        const response = await apiService.getUserChats();
        const chatList = response.data?.chats || response.data || [];
        setChats(Array.isArray(chatList) ? chatList : []);
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, []);

  // Select chat from URL param
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find((c) => c.id === chatId);
      if (chat) selectChat(chat);
    }
  }, [chatId, chats]);

  // Load messages when active chat changes
  const selectChat = useCallback(async (chat: Chat) => {
    // Leave previous chat room
    if (activeChat && activeChat.id !== chat.id) {
      leaveChat(activeChat.id);
    }

    setActiveChat(chat);
    joinChat(chat.id);

    // Load messages
    try {
      setLoading(true);
      const response = await apiService.getChatMessages(chat.id);
      const msgs = response.data?.messages || response.data || [];
      setMessages(chat.id, Array.isArray(msgs) ? msgs : []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [activeChat, joinChat, leaveChat, setActiveChat, setMessages, setLoading]);

  const handleBack = () => {
    if (activeChat) {
      leaveChat(activeChat.id);
    }
    setActiveChat(null);
    navigate('/chat');
  };

  // Search users for new chat
  const handleSearchUsers = async (query: string) => {
    setNewChatSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await apiService.searchUsers(query);
      const users = response.data?.users || response.data || [];
      setSearchResults(Array.isArray(users) ? users.filter((u: any) => u.id !== user?.id) : []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Create direct chat with user
  const handleCreateDirectChat = async (targetUser: any) => {
    try {
      const response = await apiService.createChat({
        type: 'direct',
        participantIds: [targetUser.id],
      });
      const newChat = response.data;
      setShowNewChatModal(false);
      setNewChatSearch('');
      setSearchResults([]);

      // Reload chats and select the new one
      const chatsResponse = await apiService.getUserChats();
      const chatList = chatsResponse.data?.chats || chatsResponse.data || [];
      setChats(Array.isArray(chatList) ? chatList : []);

      if (newChat?.id) {
        navigate(`/chat/${newChat.id}`);
      }
      toast.success(`Чат с ${targetUser.firstName} создан`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка создания чата');
    }
  };

  // Filter chats by search
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return chat.name?.toLowerCase().includes(q);
  });

  const getChatName = (chat: Chat) => chat.name || 'Чат';

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'Нет сообщений';
    if (chat.lastMessage.type === 'image') return '🖼 Фото';
    if (chat.lastMessage.type === 'file') return '📎 Файл';
    if (chat.lastMessage.type === 'audio') return '🎤 Голосовое';
    return chat.lastMessage.content || '';
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getTypingText = (cId: string) => {
    const users = typingUsers[cId];
    if (!users || users.length === 0) return null;
    return 'печатает...';
  };

  return (
    <MainLayout>
      <div className="flex h-full bg-[#0e1621]">
        {/* Chat list sidebar */}
        <div
          className={clsx(
            'flex flex-col border-r border-[#232e3c] bg-[#17212b] flex-shrink-0',
            activeChat ? 'hidden md:flex w-80 lg:w-96' : 'flex w-full md:w-80 lg:w-96'
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#232e3c]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Чат</h2>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-1.5 text-[#6c7883] hover:text-white hover:bg-[#232e3c] rounded-lg transition-colors"
                title="Новый чат"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
              <input
                type="text"
                placeholder="Поиск чатов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8]"
              />
            </div>
          </div>

          {/* Connection status */}
          {!isConnected && (
            <div className="px-4 py-2 bg-yellow-500/10 border-b border-[#232e3c]">
              <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Подключение...
              </p>
            </div>
          )}

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto chat-scrollbar">
            {filteredChats.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-[#6c7883]">
                <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">{searchQuery ? 'Ничего не найдено' : 'Нет чатов'}</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="mt-3 text-xs text-[#3a73b8] hover:underline"
                >
                  Начать новый чат
                </button>
              </div>
            )}

            {filteredChats.map((chat) => {
              const isActive = activeChat?.id === chat.id;
              const typing = getTypingText(chat.id);
              const unread = chat.unreadCount || 0;

              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    selectChat(chat);
                    navigate(`/chat/${chat.id}`);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    isActive ? 'bg-[#3a73b8]/20' : 'hover:bg-[#232e3c]'
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {getChatName(chat).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-white truncate">{getChatName(chat)}</p>
                      <span className="text-[10px] text-[#6c7883] flex-shrink-0 ml-2">
                        {formatTime(chat.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#6c7883] truncate">
                        {typing ? <span className="text-[#3a73b8]">{typing}</span> : getLastMessagePreview(chat)}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#3a73b8] text-[10px] text-white font-bold px-1.5 flex-shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className={clsx('flex-1 flex flex-col min-w-0', !activeChat && 'hidden md:flex')}>
          {activeChat ? (
            <>
              <ChatHeader onBack={handleBack} />
              <MessageList />
              <div className="border-t border-[#232e3c] bg-[#17212b] px-4 py-3">
                <MessageComposer />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-[#6c7883]">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-white/50 mb-1">Выберите чат</h3>
                <p className="text-sm">или начните новый разговор</p>
              </div>
            </div>
          )}
        </div>

        {/* New Chat Modal */}
        {showNewChatModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowNewChatModal(false)}>
            <div className="bg-[#17212b] border border-[#232e3c] rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#232e3c]">
                <h3 className="text-base font-semibold text-white">Новый чат</h3>
                <button onClick={() => setShowNewChatModal(false)} className="text-[#6c7883] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
                  <input
                    type="text"
                    placeholder="Поиск пользователей..."
                    value={newChatSearch}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8]"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {isSearching && (
                    <div className="flex items-center justify-center py-4 text-[#6c7883]">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm">Поиск...</span>
                    </div>
                  )}
                  {!isSearching && searchResults.length === 0 && newChatSearch.length >= 2 && (
                    <p className="text-center text-sm text-[#6c7883] py-4">Пользователи не найдены</p>
                  )}
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleCreateDirectChat(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#232e3c] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(u.firstName?.[0] || '?')}{(u.lastName?.[0] || '')}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-[#6c7883] truncate">{u.position || u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ChatPage;
