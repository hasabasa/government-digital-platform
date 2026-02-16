import { DatabaseConnection } from '@cube-demper/database';
import { Chat, Message } from '@cube-demper/types';
import { config } from '../config';
import { logger } from '../utils/logger';

export class CacheService {
  private redis = DatabaseConnection.getInstance().getRedisClient();

  /**
   * Cache chat information
   */
  async setChatInfo(chat: Chat): Promise<void> {
    try {
      const key = `${config.redis.chatRoomPrefix}${chat.id}`;
      await this.redis.setEx(key, config.redis.cacheTtl, JSON.stringify(chat));
    } catch (error) {
      logger.error('Cache set chat info failed', { error: (error as Error).message, chatId: chat.id });
    }
  }

  /**
   * Get cached chat information
   */
  async getChatInfo(chatId: string): Promise<Chat | null> {
    try {
      const key = `${config.redis.chatRoomPrefix}${chatId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) as Chat : null;
    } catch (error) {
      logger.error('Cache get chat info failed', { error: (error as Error).message, chatId });
      return null;
    }
  }

  /**
   * Invalidate chat cache
   */
  async invalidateChat(chatId: string): Promise<void> {
    try {
      const key = `${config.redis.chatRoomPrefix}${chatId}`;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache invalidate chat failed', { error: (error as Error).message, chatId });
    }
  }

  /**
   * Cache message
   */
  async cacheMessage(message: Message): Promise<void> {
    try {
      const key = `${config.redis.messagePrefix}${message.id}`;
      await this.redis.setEx(key, config.redis.cacheTtl, JSON.stringify(message));
    } catch (error) {
      logger.error('Cache message failed', { error: (error as Error).message, messageId: message.id });
    }
  }

  /**
   * Get cached message
   */
  async getCachedMessage(messageId: string): Promise<Message | null> {
    try {
      const key = `${config.redis.messagePrefix}${messageId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) as Message : null;
    } catch (error) {
      logger.error('Get cached message failed', { error: (error as Error).message, messageId });
      return null;
    }
  }

  /**
   * Invalidate message cache
   */
  async invalidateMessage(messageId: string): Promise<void> {
    try {
      const key = `${config.redis.messagePrefix}${messageId}`;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Invalidate message cache failed', { error: (error as Error).message, messageId });
    }
  }

  /**
   * Set user connection info
   */
  async setUserConnection(userId: string, socketId: string, connectionInfo: any): Promise<void> {
    try {
      const key = `${config.redis.userConnectionPrefix}${userId}`;
      const data = {
        socketId,
        connectedAt: new Date().toISOString(),
        ...connectionInfo,
      };
      await this.redis.setEx(key, config.redis.cacheTtl, JSON.stringify(data));
    } catch (error) {
      logger.error('Set user connection failed', { error: (error as Error).message, userId, socketId });
    }
  }

  /**
   * Get user connection info
   */
  async getUserConnection(userId: string): Promise<any | null> {
    try {
      const key = `${config.redis.userConnectionPrefix}${userId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Get user connection failed', { error: (error as Error).message, userId });
      return null;
    }
  }

  /**
   * Remove user connection
   */
  async removeUserConnection(userId: string): Promise<void> {
    try {
      const key = `${config.redis.userConnectionPrefix}${userId}`;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Remove user connection failed', { error: (error as Error).message, userId });
    }
  }

  /**
   * Add user to chat room
   */
  async addUserToRoom(chatId: string, userId: string): Promise<void> {
    try {
      const key = `chat:participants:${chatId}`;
      await this.redis.sAdd(key, userId);
      await this.redis.expire(key, config.redis.cacheTtl);
    } catch (error) {
      logger.error('Add user to room failed', { error: (error as Error).message, chatId, userId });
    }
  }

  /**
   * Remove user from chat room
   */
  async removeUserFromRoom(chatId: string, userId: string): Promise<void> {
    try {
      const key = `chat:participants:${chatId}`;
      await this.redis.sRem(key, userId);
    } catch (error) {
      logger.error('Remove user from room failed', { error: (error as Error).message, chatId, userId });
    }
  }

  /**
   * Get chat room participants
   */
  async getRoomParticipants(chatId: string): Promise<string[]> {
    try {
      const key = `chat:participants:${chatId}`;
      return await this.redis.sMembers(key);
    } catch (error) {
      logger.error('Get room participants failed', { error: (error as Error).message, chatId });
      return [];
    }
  }

  /**
   * Set typing indicator
   */
  async setTypingIndicator(chatId: string, userId: string): Promise<void> {
    try {
      const key = `${config.redis.typingPrefix}${chatId}`;
      await this.redis.setEx(`${key}:${userId}`, 5, 'typing'); // 5 seconds TTL
    } catch (error) {
      logger.error('Set typing indicator failed', { error: (error as Error).message, chatId, userId });
    }
  }

  /**
   * Get typing users in chat
   */
  async getTypingUsers(chatId: string): Promise<string[]> {
    try {
      const pattern = `${config.redis.typingPrefix}${chatId}:*`;
      const keys = await this.redis.keys(pattern);
      return keys.map(key => key.split(':').pop() || '');
    } catch (error) {
      logger.error('Get typing users failed', { error: (error as Error).message, chatId });
      return [];
    }
  }

  /**
   * Remove typing indicator
   */
  async removeTypingIndicator(chatId: string, userId: string): Promise<void> {
    try {
      const key = `${config.redis.typingPrefix}${chatId}:${userId}`;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Remove typing indicator failed', { error: (error as Error).message, chatId, userId });
    }
  }

  /**
   * Cache chat messages list
   */
  async cacheMessagesList(chatId: string, messages: Message[]): Promise<void> {
    try {
      const key = `chat:messages:${chatId}`;
      await this.redis.setEx(key, 300, JSON.stringify(messages)); // 5 minutes cache
    } catch (error) {
      logger.error('Cache messages list failed', { error: (error as Error).message, chatId });
    }
  }

  /**
   * Get cached messages list
   */
  async getCachedMessagesList(chatId: string): Promise<Message[] | null> {
    try {
      const key = `chat:messages:${chatId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) as Message[] : null;
    } catch (error) {
      logger.error('Get cached messages list failed', { error: (error as Error).message, chatId });
      return null;
    }
  }

  /**
   * Store recent user activity
   */
  async updateUserActivity(userId: string): Promise<void> {
    try {
      const key = `user:activity:${userId}`;
      await this.redis.setEx(key, 300, new Date().toISOString()); // 5 minutes
    } catch (error) {
      logger.error('Update user activity failed', { error: (error as Error).message, userId });
    }
  }

  /**
   * Get user last activity
   */
  async getUserLastActivity(userId: string): Promise<Date | null> {
    try {
      const key = `user:activity:${userId}`;
      const activity = await this.redis.get(key);
      return activity ? new Date(activity) : null;
    } catch (error) {
      logger.error('Get user last activity failed', { error: (error as Error).message, userId });
      return null;
    }
  }
}
