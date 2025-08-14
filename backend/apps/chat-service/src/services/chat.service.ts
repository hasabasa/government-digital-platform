import { DatabaseConnection } from '@gov-platform/database';
import { chats, chatParticipants, messages } from '@gov-platform/database/schema';
import { eq, and, or, desc, sql, asc } from 'drizzle-orm';
import {
  Chat,
  ChatParticipant,
  Message,
  CreateChatRequest,
  SendMessageRequest,
  PaginatedResponse,
  Pagination,
} from '@gov-platform/types';
import { logger } from '../utils/logger';
import { CacheService } from './cache.service';
import { EncryptionUtils } from '../utils/encryption';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  private db = DatabaseConnection.getInstance().getDb();
  private cacheService = new CacheService();

  /**
   * Create new chat
   */
  async createChat(creatorId: string, chatData: CreateChatRequest): Promise<Chat> {
    try {
      // Validate participants
      if (chatData.participantIds.length === 0) {
        throw new Error('At least one participant is required');
      }

      // For direct chats, ensure only 2 participants
      if (chatData.type === 'direct' && chatData.participantIds.length !== 1) {
        throw new Error('Direct chat must have exactly one other participant');
      }

      // Check if direct chat already exists
      if (chatData.type === 'direct') {
        const existingChat = await this.findDirectChat(creatorId, chatData.participantIds[0]);
        if (existingChat) {
          return existingChat;
        }
      }

      // Generate encryption key for the chat
      const encryptionKey = EncryptionUtils.generateSymmetricKey();

      const newChat = {
        id: uuidv4(),
        type: chatData.type,
        name: chatData.name,
        description: chatData.description,
        isPrivate: chatData.isPrivate,
        encryptionKey,
        createdBy: creatorId,
        participantCount: chatData.participantIds.length + 1, // +1 for creator
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [createdChat] = await this.db
        .insert(chats)
        .values(newChat)
        .returning();

      // Add creator as admin
      await this.addParticipant(createdChat.id, creatorId, 'admin');

      // Add other participants
      for (const participantId of chatData.participantIds) {
        await this.addParticipant(createdChat.id, participantId, 'member');
      }

      // Cache the chat
      await this.cacheService.setChatInfo(createdChat);

      logger.info('Chat created successfully', {
        chatId: createdChat.id,
        type: chatData.type,
        creatorId,
        participantCount: createdChat.participantCount,
      });

      return createdChat;
    } catch (error) {
      logger.error('Create chat failed', { error: (error as Error).message, creatorId, chatData });
      throw error;
    }
  }

  /**
   * Send message to chat
   */
  async sendMessage(senderId: string, messageData: SendMessageRequest): Promise<Message> {
    try {
      // Verify user is participant in the chat
      const isParticipant = await this.isUserParticipant(messageData.chatId, senderId);
      if (!isParticipant) {
        throw new Error('User is not a participant in this chat');
      }

      // Get chat info for encryption
      const chat = await this.getChatById(messageData.chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      let encryptedContent = '';
      if (messageData.encrypt && chat.encryptionKey) {
        const encrypted = EncryptionUtils.encryptMessage(messageData.content, chat.encryptionKey);
        encryptedContent = JSON.stringify(encrypted);
      }

      const newMessage = {
        id: uuidv4(),
        chatId: messageData.chatId,
        senderId,
        type: messageData.type,
        content: messageData.content,
        encryptedContent: encryptedContent || undefined,
        fileId: messageData.fileId,
        replyToId: messageData.replyToId,
        readBy: JSON.stringify([{
          userId: senderId,
          readAt: new Date(),
        }]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [createdMessage] = await this.db
        .insert(messages)
        .values(newMessage)
        .returning();

      // Update chat's last message time
      await this.db
        .update(chats)
        .set({
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(chats.id, messageData.chatId));

      // Cache the message
      await this.cacheService.cacheMessage(createdMessage);

      // Update chat cache
      await this.cacheService.invalidateChat(messageData.chatId);

      logger.info('Message sent successfully', {
        messageId: createdMessage.id,
        chatId: messageData.chatId,
        senderId,
        type: messageData.type,
      });

      return createdMessage;
    } catch (error) {
      logger.error('Send message failed', { error: (error as Error).message, senderId, messageData });
      throw error;
    }
  }

  /**
   * Get chat messages with pagination
   */
  async getChatMessages(
    chatId: string,
    userId: string,
    pagination: Pagination
  ): Promise<PaginatedResponse<Message>> {
    try {
      // Verify user is participant
      const isParticipant = await this.isUserParticipant(chatId, userId);
      if (!isParticipant) {
        throw new Error('Access denied');
      }

      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const [messagesResult, countResult] = await Promise.all([
        this.db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.chatId, chatId),
              eq(messages.isDeleted, false)
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.chatId, chatId),
              eq(messages.isDeleted, false)
            )
          )
      ]);

      // Reverse to show chronological order
      const orderedMessages = messagesResult.reverse();

      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: orderedMessages,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Get chat messages failed', { error: (error as Error).message, chatId, userId });
      throw error;
    }
  }

  /**
   * Get user's chats
   */
  async getUserChats(
    userId: string,
    pagination: Pagination
  ): Promise<PaginatedResponse<Chat & { lastMessage?: Message }>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Get chats where user is participant
      const userChatsQuery = this.db
        .select({
          chat: chats,
          participant: chatParticipants,
        })
        .from(chatParticipants)
        .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
        .where(eq(chatParticipants.userId, userId))
        .orderBy(desc(chats.lastMessageAt))
        .limit(limit)
        .offset(offset);

      const countQuery = this.db
        .select({ count: sql<number>`count(*)` })
        .from(chatParticipants)
        .where(eq(chatParticipants.userId, userId));

      const [chatsResult, countResult] = await Promise.all([
        userChatsQuery,
        countQuery
      ]);

      // Get last message for each chat
      const chatsWithLastMessage = await Promise.all(
        chatsResult.map(async (result) => {
          const lastMessage = await this.getLastMessage(result.chat.id);
          return {
            ...result.chat,
            lastMessage,
          };
        })
      );

      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: chatsWithLastMessage,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Get user chats failed', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      const [message] = await this.db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!message) {
        throw new Error('Message not found');
      }

      // Verify user is participant
      const isParticipant = await this.isUserParticipant(message.chatId, userId);
      if (!isParticipant) {
        throw new Error('Access denied');
      }

      const readBy = Array.isArray(message.readBy) ? message.readBy : [];
      const existingRead = readBy.find((read: any) => read.userId === userId);

      if (!existingRead) {
        readBy.push({
          userId,
          readAt: new Date(),
        });

        await this.db
          .update(messages)
          .set({
            readBy: JSON.stringify(readBy),
            updatedAt: new Date(),
          })
          .where(eq(messages.id, messageId));
      }
    } catch (error) {
      logger.error('Mark message as read failed', { error: (error as Error).message, messageId, userId });
      throw error;
    }
  }

  /**
   * Edit message
   */
  async editMessage(messageId: string, userId: string, newContent: string): Promise<Message> {
    try {
      const [message] = await this.db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.senderId !== userId) {
        throw new Error('Can only edit your own messages');
      }

      // Check edit time limit
      const editTimeLimit = new Date(message.createdAt.getTime() + (5 * 60 * 1000)); // 5 minutes
      if (new Date() > editTimeLimit) {
        throw new Error('Edit time limit exceeded');
      }

      // Re-encrypt if needed
      let encryptedContent = '';
      if (message.encryptedContent) {
        const chat = await this.getChatById(message.chatId);
        if (chat?.encryptionKey) {
          const encrypted = EncryptionUtils.encryptMessage(newContent, chat.encryptionKey);
          encryptedContent = JSON.stringify(encrypted);
        }
      }

      const [updatedMessage] = await this.db
        .update(messages)
        .set({
          content: newContent,
          encryptedContent: encryptedContent || message.encryptedContent,
          isEdited: true,
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId))
        .returning();

      await this.cacheService.invalidateMessage(messageId);

      logger.info('Message edited successfully', { messageId, userId });

      return updatedMessage;
    } catch (error) {
      logger.error('Edit message failed', { error: (error as Error).message, messageId, userId });
      throw error;
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const [message] = await this.db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.senderId !== userId) {
        throw new Error('Can only delete your own messages');
      }

      await this.db
        .update(messages)
        .set({
          isDeleted: true,
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId));

      await this.cacheService.invalidateMessage(messageId);

      logger.info('Message deleted successfully', { messageId, userId });
    } catch (error) {
      logger.error('Delete message failed', { error: (error as Error).message, messageId, userId });
      throw error;
    }
  }

  /**
   * Add participant to chat
   */
  private async addParticipant(chatId: string, userId: string, role: 'admin' | 'moderator' | 'member' = 'member'): Promise<void> {
    const participant = {
      id: uuidv4(),
      chatId,
      userId,
      role,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.insert(chatParticipants).values(participant);
  }

  /**
   * Check if user is participant in chat
   */
  private async isUserParticipant(chatId: string, userId: string): Promise<boolean> {
    const [participant] = await this.db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId),
          eq(chatParticipants.isBlocked, false)
        )
      )
      .limit(1);

    return !!participant;
  }

  /**
   * Get chat by ID
   */
  private async getChatById(chatId: string): Promise<Chat | null> {
    // Try cache first
    const cached = await this.cacheService.getChatInfo(chatId);
    if (cached) {
      return cached;
    }

    const [chat] = await this.db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chat) {
      await this.cacheService.setChatInfo(chat);
    }

    return chat || null;
  }

  /**
   * Find existing direct chat between two users
   */
  private async findDirectChat(user1Id: string, user2Id: string): Promise<Chat | null> {
    const directChatsQuery = this.db
      .select({ chat: chats })
      .from(chats)
      .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .where(
        and(
          eq(chats.type, 'direct'),
          or(
            eq(chatParticipants.userId, user1Id),
            eq(chatParticipants.userId, user2Id)
          )
        )
      )
      .groupBy(chats.id)
      .having(sql`count(*) = 2`);

    const results = await directChatsQuery;
    
    if (results.length > 0) {
      return results[0].chat;
    }

    return null;
  }

  /**
   * Get last message for chat
   */
  private async getLastMessage(chatId: string): Promise<Message | undefined> {
    const [lastMessage] = await this.db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          eq(messages.isDeleted, false)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(1);

    return lastMessage;
  }
}
