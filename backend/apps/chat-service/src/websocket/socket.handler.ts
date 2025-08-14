import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/chat.service';
import { CacheService } from '../services/cache.service';
import { logger } from '../utils/logger';
import { WebSocketEvent } from '@gov-platform/types';
import axios from 'axios';
import { config } from '../config';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class SocketHandler {
  private io: Server;
  private chatService: ChatService;
  private cacheService: CacheService;

  constructor(io: Server) {
    this.io = io;
    this.chatService = new ChatService();
    this.cacheService = new CacheService();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Validate token with Auth Service
        const authResponse = await axios.get(
          `${config.authService.url}/api/v1/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: config.authService.timeout,
          }
        );

        if (!authResponse.data.success || !authResponse.data.data) {
          return next(new Error('Invalid authentication token'));
        }

        const user = authResponse.data.data;
        socket.userId = user.id;
        socket.user = user;

        logger.info('Socket authenticated', {
          socketId: socket.id,
          userId: user.id,
          email: user.email,
        });

        next();
      } catch (error) {
        logger.error('Socket authentication failed', {
          error: (error as Error).message,
          socketId: socket.id,
        });
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      if (!socket.userId) return;

      logger.info('User connected', {
        socketId: socket.id,
        userId: socket.userId,
      });

      // Store connection info
      await this.cacheService.setUserConnection(socket.userId, socket.id, {
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address,
      });

      // Update user activity
      await this.cacheService.updateUserActivity(socket.userId);

      // Setup event handlers for this socket
      this.setupSocketEvents(socket);

      // Handle disconnection
      socket.on('disconnect', () => this.handleDisconnection(socket));
    } catch (error) {
      logger.error('Handle connection failed', {
        error: (error as Error).message,
        socketId: socket.id,
        userId: socket.userId,
      });
    }
  }

  /**
   * Setup events for individual socket
   */
  private setupSocketEvents(socket: AuthenticatedSocket): void {
    // Join chat room
    socket.on('join_chat', async (data: { chatId: string }) => {
      await this.handleJoinChat(socket, data.chatId);
    });

    // Leave chat room
    socket.on('leave_chat', async (data: { chatId: string }) => {
      await this.handleLeaveChat(socket, data.chatId);
    });

    // Send message
    socket.on('send_message', async (data: any) => {
      await this.handleSendMessage(socket, data);
    });

    // Edit message
    socket.on('edit_message', async (data: { messageId: string; content: string }) => {
      await this.handleEditMessage(socket, data.messageId, data.content);
    });

    // Delete message
    socket.on('delete_message', async (data: { messageId: string }) => {
      await this.handleDeleteMessage(socket, data.messageId);
    });

    // Mark message as read
    socket.on('mark_read', async (data: { messageId: string }) => {
      await this.handleMarkRead(socket, data.messageId);
    });

    // Typing indicator
    socket.on('typing_start', async (data: { chatId: string }) => {
      await this.handleTypingStart(socket, data.chatId);
    });

    socket.on('typing_stop', async (data: { chatId: string }) => {
      await this.handleTypingStop(socket, data.chatId);
    });

    // User status
    socket.on('update_status', async (data: { status: string }) => {
      await this.handleUpdateStatus(socket, data.status);
    });
  }

  /**
   * Handle join chat room
   */
  private async handleJoinChat(socket: AuthenticatedSocket, chatId: string): Promise<void> {
    try {
      if (!socket.userId) return;

      // Verify user can access this chat
      // This would typically involve checking chat participants
      await socket.join(`chat:${chatId}`);
      await this.cacheService.addUserToRoom(chatId, socket.userId);

      socket.emit('joined_chat', { chatId, success: true });

      // Notify other participants that user joined
      socket.to(`chat:${chatId}`).emit('user_joined', {
        userId: socket.userId,
        chatId,
        timestamp: new Date(),
      });

      logger.info('User joined chat', {
        userId: socket.userId,
        chatId,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error('Join chat failed', {
        error: (error as Error).message,
        userId: socket.userId,
        chatId,
        socketId: socket.id,
      });

      socket.emit('joined_chat', { chatId, success: false, error: (error as Error).message });
    }
  }

  /**
   * Handle leave chat room
   */
  private async handleLeaveChat(socket: AuthenticatedSocket, chatId: string): Promise<void> {
    try {
      if (!socket.userId) return;

      await socket.leave(`chat:${chatId}`);
      await this.cacheService.removeUserFromRoom(chatId, socket.userId);
      await this.cacheService.removeTypingIndicator(chatId, socket.userId);

      socket.emit('left_chat', { chatId, success: true });

      // Notify other participants that user left
      socket.to(`chat:${chatId}`).emit('user_left', {
        userId: socket.userId,
        chatId,
        timestamp: new Date(),
      });

      logger.info('User left chat', {
        userId: socket.userId,
        chatId,
        socketId: socket.id,
      });
    } catch (error) {
      logger.error('Leave chat failed', {
        error: (error as Error).message,
        userId: socket.userId,
        chatId,
        socketId: socket.id,
      });
    }
  }

  /**
   * Handle send message
   */
  private async handleSendMessage(socket: AuthenticatedSocket, messageData: any): Promise<void> {
    try {
      if (!socket.userId) return;

      const message = await this.chatService.sendMessage(socket.userId, messageData);

      // Emit to all chat participants
      const event: WebSocketEvent = {
        type: 'message:new',
        data: message,
      };

      this.io.to(`chat:${messageData.chatId}`).emit('message:new', event.data);

      // Stop typing indicator for sender
      await this.cacheService.removeTypingIndicator(messageData.chatId, socket.userId);
      this.io.to(`chat:${messageData.chatId}`).emit('typing_stopped', {
        userId: socket.userId,
        chatId: messageData.chatId,
      });

      logger.info('Message sent via WebSocket', {
        messageId: message.id,
        chatId: messageData.chatId,
        senderId: socket.userId,
      });
    } catch (error) {
      logger.error('Send message via WebSocket failed', {
        error: (error as Error).message,
        userId: socket.userId,
        messageData,
      });

      socket.emit('message_error', {
        error: (error as Error).message,
        messageData,
      });
    }
  }

  /**
   * Handle edit message
   */
  private async handleEditMessage(socket: AuthenticatedSocket, messageId: string, content: string): Promise<void> {
    try {
      if (!socket.userId) return;

      const updatedMessage = await this.chatService.editMessage(messageId, socket.userId, content);

      // Emit to all chat participants
      const event: WebSocketEvent = {
        type: 'message:update',
        data: updatedMessage,
      };

      this.io.to(`chat:${updatedMessage.chatId}`).emit('message:update', event.data);

      logger.info('Message edited via WebSocket', {
        messageId,
        userId: socket.userId,
      });
    } catch (error) {
      logger.error('Edit message via WebSocket failed', {
        error: (error as Error).message,
        messageId,
        userId: socket.userId,
      });

      socket.emit('edit_error', {
        error: (error as Error).message,
        messageId,
      });
    }
  }

  /**
   * Handle delete message
   */
  private async handleDeleteMessage(socket: AuthenticatedSocket, messageId: string): Promise<void> {
    try {
      if (!socket.userId) return;

      await this.chatService.deleteMessage(messageId, socket.userId);

      // Get chat ID from cache or database
      const message = await this.cacheService.getCachedMessage(messageId);
      if (message) {
        // Emit to all chat participants
        const event: WebSocketEvent = {
          type: 'message:delete',
          data: {
            messageId,
            chatId: message.chatId,
          },
        };

        this.io.to(`chat:${message.chatId}`).emit('message:delete', event.data);
      }

      logger.info('Message deleted via WebSocket', {
        messageId,
        userId: socket.userId,
      });
    } catch (error) {
      logger.error('Delete message via WebSocket failed', {
        error: (error as Error).message,
        messageId,
        userId: socket.userId,
      });

      socket.emit('delete_error', {
        error: (error as Error).message,
        messageId,
      });
    }
  }

  /**
   * Handle mark message as read
   */
  private async handleMarkRead(socket: AuthenticatedSocket, messageId: string): Promise<void> {
    try {
      if (!socket.userId) return;

      await this.chatService.markMessageAsRead(messageId, socket.userId);

      // Get message to find chat ID
      const message = await this.cacheService.getCachedMessage(messageId);
      if (message) {
        socket.to(`chat:${message.chatId}`).emit('message_read', {
          messageId,
          userId: socket.userId,
          readAt: new Date(),
        });
      }
    } catch (error) {
      logger.error('Mark read via WebSocket failed', {
        error: (error as Error).message,
        messageId,
        userId: socket.userId,
      });
    }
  }

  /**
   * Handle typing start
   */
  private async handleTypingStart(socket: AuthenticatedSocket, chatId: string): Promise<void> {
    try {
      if (!socket.userId) return;

      await this.cacheService.setTypingIndicator(chatId, socket.userId);

      socket.to(`chat:${chatId}`).emit('typing_started', {
        userId: socket.userId,
        chatId,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Typing start failed', {
        error: (error as Error).message,
        userId: socket.userId,
        chatId,
      });
    }
  }

  /**
   * Handle typing stop
   */
  private async handleTypingStop(socket: AuthenticatedSocket, chatId: string): Promise<void> {
    try {
      if (!socket.userId) return;

      await this.cacheService.removeTypingIndicator(chatId, socket.userId);

      socket.to(`chat:${chatId}`).emit('typing_stopped', {
        userId: socket.userId,
        chatId,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Typing stop failed', {
        error: (error as Error).message,
        userId: socket.userId,
        chatId,
      });
    }
  }

  /**
   * Handle user status update
   */
  private async handleUpdateStatus(socket: AuthenticatedSocket, status: string): Promise<void> {
    try {
      if (!socket.userId) return;

      await this.cacheService.updateUserActivity(socket.userId);

      // Broadcast status to all connected rooms
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        status,
        timestamp: new Date(),
      });

      logger.info('User status updated', {
        userId: socket.userId,
        status,
      });
    } catch (error) {
      logger.error('Update status failed', {
        error: (error as Error).message,
        userId: socket.userId,
        status,
      });
    }
  }

  /**
   * Handle socket disconnection
   */
  private async handleDisconnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      if (!socket.userId) return;

      // Remove from all chat rooms
      const rooms = Array.from(socket.rooms).filter(room => room.startsWith('chat:'));
      for (const room of rooms) {
        const chatId = room.replace('chat:', '');
        await this.cacheService.removeUserFromRoom(chatId, socket.userId);
        await this.cacheService.removeTypingIndicator(chatId, socket.userId);
        
        socket.to(room).emit('user_left', {
          userId: socket.userId,
          chatId,
          timestamp: new Date(),
        });
      }

      // Remove connection info
      await this.cacheService.removeUserConnection(socket.userId);

      logger.info('User disconnected', {
        socketId: socket.id,
        userId: socket.userId,
      });
    } catch (error) {
      logger.error('Handle disconnection failed', {
        error: (error as Error).message,
        socketId: socket.id,
        userId: socket.userId,
      });
    }
  }
}
