import { create } from 'zustand';
import { Chat, Message } from '../types';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filter: 'all' | 'channels' | 'groups' | 'direct';
  unreadCounts: Record<string, number>;
}

interface ChatActions {
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: 'all' | 'channels' | 'groups' | 'direct') => void;
  setUnreadCount: (chatId: string, count: number) => void;
  incrementUnreadCount: (chatId: string) => void;
  clearUnreadCount: (chatId: string) => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // State
  chats: [],
  activeChat: null,
  messages: {},
  isLoading: false,
  error: null,
  searchQuery: '',
  filter: 'all',
  unreadCounts: {},

  // Actions
  setChats: (chats) => {
    set({ chats });
  },

  addChat: (chat) => {
    set((state) => ({
      chats: [chat, ...state.chats],
    }));
  },

  updateChat: (chatId, updates) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, ...updates } : chat
      ),
      activeChat:
        state.activeChat?.id === chatId
          ? { ...state.activeChat, ...updates }
          : state.activeChat,
    }));
  },

  removeChat: (chatId) => {
    set((state) => ({
      chats: state.chats.filter((chat) => chat.id !== chatId),
      activeChat: state.activeChat?.id === chatId ? null : state.activeChat,
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([id]) => id !== chatId)
      ),
      unreadCounts: Object.fromEntries(
        Object.entries(state.unreadCounts).filter(([id]) => id !== chatId)
      ),
    }));
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat });
    if (chat) {
      get().clearUnreadCount(chat.id);
    }
  },

  setMessages: (chatId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages,
      },
    }));
  },

  addMessage: (chatId, message) => {
    set((state) => {
      const currentMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: [...currentMessages, message],
        },
      };
    });

    // Update last message in chat
    const state = get();
    const chat = state.chats.find((c) => c.id === chatId);
    if (chat) {
      get().updateChat(chatId, {
        lastMessage: message,
        lastMessageAt: message.createdAt,
      });
    }

    // Increment unread count if not active chat
    if (state.activeChat?.id !== chatId) {
      get().incrementUnreadCount(chatId);
    }
  },

  updateMessage: (chatId, messageId, updates) => {
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        },
      };
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setFilter: (filter) => {
    set({ filter });
  },

  setUnreadCount: (chatId, count) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: count,
      },
    }));
  },

  incrementUnreadCount: (chatId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: (state.unreadCounts[chatId] || 0) + 1,
      },
    }));
  },

  clearUnreadCount: (chatId) => {
    set((state) => {
      const newUnreadCounts = { ...state.unreadCounts };
      delete newUnreadCounts[chatId];
      return { unreadCounts: newUnreadCounts };
    });
  },
}));
