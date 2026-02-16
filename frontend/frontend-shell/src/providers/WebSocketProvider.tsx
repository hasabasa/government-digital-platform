import React from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import { useChatStore } from '../stores/chat.store';
import { Message } from '../types';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (chatId: string, content: string, type?: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  typingUsers: Record<string, string[]>;
}

const WebSocketContext = React.createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  joinChat: () => {},
  leaveChat: () => {},
  typingUsers: {},
});

export const useWebSocket = () => React.useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const socketRef = React.useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [typingUsers, setTypingUsers] = React.useState<Record<string, string[]>>({});
  const { token, user } = useAuthStore();
  const chatStoreRef = React.useRef(useChatStore.getState());

  // Keep store ref fresh
  React.useEffect(() => {
    const unsub = useChatStore.subscribe((state) => {
      chatStoreRef.current = state;
    });
    return unsub;
  }, []);

  // Connect socket — only depends on token/user, NOT on chat store
  React.useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('[WS] Connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[WS] Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[WS] Connection error:', error.message);
      setIsConnected(false);
    });

    // === Chat events ===
    newSocket.on('message:new', (message: Message) => {
      chatStoreRef.current.addMessage(message.chatId, message);

      // Notification if not in active chat
      const active = chatStoreRef.current.activeChat;
      if (active?.id !== message.chatId && message.senderId !== user.id) {
        toast(`Новое сообщение${message.senderName ? ` от ${message.senderName}` : ''}`, { icon: '💬' });
      }
    });

    newSocket.on('message:update', (data: { messageId: string; chatId: string; content: string }) => {
      chatStoreRef.current.updateMessage(data.chatId, data.messageId, {
        content: data.content,
        isEdited: true,
      });
    });

    newSocket.on('message:delete', (data: { messageId: string; chatId: string }) => {
      chatStoreRef.current.updateMessage(data.chatId, data.messageId, {
        isDeleted: true,
      });
    });

    newSocket.on('message_read', (_data: { messageId: string; userId: string; readAt: string }) => {
      // Could update read status on messages
    });

    newSocket.on('typing_started', (data: { userId: string; chatId: string }) => {
      if (data.userId === user.id) return;
      setTypingUsers((prev) => {
        const current = prev[data.chatId] || [];
        if (current.includes(data.userId)) return prev;
        return { ...prev, [data.chatId]: [...current, data.userId] };
      });
    });

    newSocket.on('typing_stopped', (data: { userId: string; chatId: string }) => {
      setTypingUsers((prev) => {
        const current = prev[data.chatId] || [];
        return { ...prev, [data.chatId]: current.filter((id) => id !== data.userId) };
      });
    });

    newSocket.on('user_status_changed', (_data: { userId: string; status: string }) => {
      // Could update user online status
    });

    newSocket.on('message_error', (data: { error: string }) => {
      toast.error(data.error || 'Ошибка отправки');
    });

    socketRef.current = newSocket;

    return () => {
      newSocket.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token, user?.id]);

  // Helper methods
  const sendMessage = React.useCallback((chatId: string, content: string, type = 'text') => {
    socketRef.current?.emit('send_message', { chatId, content, type });
  }, []);

  const startTyping = React.useCallback((chatId: string) => {
    socketRef.current?.emit('typing_start', { chatId });
  }, []);

  const stopTyping = React.useCallback((chatId: string) => {
    socketRef.current?.emit('typing_stop', { chatId });
  }, []);

  const joinChat = React.useCallback((chatId: string) => {
    socketRef.current?.emit('join_chat', { chatId });
  }, []);

  const leaveChat = React.useCallback((chatId: string) => {
    socketRef.current?.emit('leave_chat', { chatId });
  }, []);

  const value = React.useMemo(() => ({
    socket: socketRef.current,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    joinChat,
    leaveChat,
    typingUsers,
  }), [isConnected, sendMessage, startTyping, stopTyping, joinChat, leaveChat, typingUsers]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
