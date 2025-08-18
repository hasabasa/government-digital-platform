import { create } from 'zustand';
import { Chat, Message, User } from '../types';
import apiService from '../services/api.service';
import websocketService from '../services/websocket.service';

interface ChatState {
  // State
  chats: Chat[];
  currentChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, Set<string>>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string, page?: number) => Promise<void>;
  sendMessage: (chatId: string, content: string, type?: string, attachments?: File[]) => Promise<void>;
  createChat: (chatData: Partial<Chat>) => Promise<Chat>;
  updateChat: (chatId: string, chatData: Partial<Chat>) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  setCurrentChat: (chat: Chat | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  setTypingUser: (chatId: string, userId: string, isTyping: boolean) => void;
  clearError: () => void;
  
  // WebSocket handlers
  setupWebSocket: () => void;
  cleanupWebSocket: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  chats: [],
  currentChat: null,
  messages: {},
  typingUsers: {},
  isLoading: false,
  error: null,

  // Actions
  fetchChats: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const chats = await apiService.getChats();
      set({ chats, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch chats', 
        isLoading: false 
      });
    }
  },

  fetchMessages: async (chatId: string, page: number = 1) => {
    try {
      const response = await apiService.getChatMessages(chatId, page);
      const existingMessages = get().messages[chatId] || [];
      
      if (page === 1) {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: response.data
          }
        }));
      } else {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: [...existingMessages, ...response.data]
          }
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages' 
      });
    }
  },

  sendMessage: async (chatId: string, content: string, type: string = 'text', attachments: File[] = []) => {
    try {
      // Create message object
      const messageData: Partial<Message> = {
        chatId,
        content,
        type: type as any,
      };

      // Send message via API
      const message = await apiService.sendMessage(messageData);
      
      // Add message to local state
      get().addMessage(chatId, message);
      
      // Send typing stop
      websocketService.sendTypingStop(chatId);
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      });
      throw error;
    }
  },

  createChat: async (chatData: Partial<Chat>) => {
    try {
      const chat = await apiService.createChat(chatData);
      set(state => ({
        chats: [...state.chats, chat]
      }));
      return chat;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create chat' 
      });
      throw error;
    }
  },

  updateChat: async (chatId: string, chatData: Partial<Chat>) => {
    try {
      await apiService.updateChat(chatId, chatData);
      set(state => ({
        chats: state.chats.map(chat => 
          chat.id === chatId ? { ...chat, ...chatData } : chat
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update chat' 
      });
    }
  },

  deleteChat: async (chatId: string) => {
    try {
      await apiService.deleteChat(chatId);
      set(state => ({
        chats: state.chats.filter(chat => chat.id !== chatId),
        messages: { ...state.messages, [chatId]: undefined }
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete chat' 
      });
    }
  },

  setCurrentChat: (chat: Chat | null) => {
    set({ currentChat: chat });
  },

  addMessage: (chatId: string, message: Message) => {
    set(state => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message]
      }
    }));
  },

  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => {
    set(state => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map(message =>
          message.id === messageId ? { ...message, ...updates } : message
        )
      }
    }));
  },

  deleteMessage: (chatId: string, messageId: string) => {
    set(state => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).filter(message =>
          message.id !== messageId
        )
      }
    }));
  },

  setTypingUser: (chatId: string, userId: string, isTyping: boolean) => {
    set(state => {
      const currentTyping = state.typingUsers[chatId] || new Set();
      
      if (isTyping) {
        currentTyping.add(userId);
      } else {
        currentTyping.delete(userId);
      }
      
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: currentTyping
        }
      };
    });
  },

  clearError: () => set({ error: null }),

  // WebSocket setup
  setupWebSocket: () => {
    const unsubscribe = websocketService.onMessage((event) => {
      switch (event.type) {
        case 'message:new':
          if (event.payload.message) {
            get().addMessage(event.payload.chatId, event.payload.message);
          }
          break;
          
        case 'message:updated':
          if (event.payload.message) {
            get().updateMessage(
              event.payload.chatId, 
              event.payload.message.id, 
              event.payload.message
            );
          }
          break;
          
        case 'message:deleted':
          if (event.payload.message) {
            get().deleteMessage(event.payload.chatId, event.payload.message.id);
          }
          break;
          
        case 'typing:start':
          if (event.payload.userId) {
            get().setTypingUser(event.payload.chatId, event.payload.userId, true);
          }
          break;
          
        case 'typing:stop':
          if (event.payload.userId) {
            get().setTypingUser(event.payload.chatId, event.payload.userId, false);
          }
          break;
      }
    });

    // Store unsubscribe function for cleanup
    (get as any).unsubscribeWebSocket = unsubscribe;
  },

  cleanupWebSocket: () => {
    const unsubscribe = (get as any).unsubscribeWebSocket;
    if (unsubscribe) {
      unsubscribe();
      (get as any).unsubscribeWebSocket = null;
    }
  },
}));
