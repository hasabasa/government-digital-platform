import React from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import { useChatStore } from '../stores/chat.store';
import { Message, Chat } from '../types';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = React.createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
});

export const useWebSocket = () => {
  const context = React.useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const { token, user } = useAuthStore();
  const { addMessage, updateChat, activeChat } = useChatStore();

  React.useEffect(() => {
    if (!token || !user) return;

    // Create socket connection
    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080', {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Chat events
    newSocket.on('message:new', (message: Message) => {
      console.log('New message received:', message);
      addMessage(message.chatId, message);

      // Show notification if not in active chat
      if (activeChat?.id !== message.chatId && message.senderId !== user.id) {
        toast.success(`Новое сообщение от ${message.senderName}`);
      }
    });

    newSocket.on('message:updated', (data: { chatId: string; messageId: string; updates: Partial<Message> }) => {
      console.log('Message updated:', data);
      // TODO: Implement message update in store
    });

    newSocket.on('chat:updated', (chat: Chat) => {
      console.log('Chat updated:', chat);
      updateChat(chat.id, chat);
    });

    newSocket.on('user:typing', (data: { chatId: string; userId: string; userName: string }) => {
      console.log('User typing:', data);
      // TODO: Show typing indicator
    });

    newSocket.on('user:stopped_typing', (data: { chatId: string; userId: string }) => {
      console.log('User stopped typing:', data);
      // TODO: Hide typing indicator
    });

    newSocket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      toast.error('Ошибка соединения с сервером');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, user, addMessage, updateChat, activeChat]);

  // Join active chat room
  React.useEffect(() => {
    if (socket && activeChat) {
      socket.emit('join_chat', { chatId: activeChat.id });
      console.log('Joined chat:', activeChat.id);

      return () => {
        socket.emit('leave_chat', { chatId: activeChat.id });
        console.log('Left chat:', activeChat.id);
      };
    }
  }, [socket, activeChat]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
