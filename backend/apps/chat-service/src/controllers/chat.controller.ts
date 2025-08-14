import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { logger } from '../utils/logger';
import {
  CreateChatRequest,
  SendMessageRequest,
  PaginationSchema,
  ApiResponse,
  Chat,
  Message,
  PaginatedResponse,
} from '@gov-platform/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

export class ChatController {
  private chatService = new ChatService();

  /**
   * Create new chat
   */
  createChat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const chatData: CreateChatRequest = req.body;
      const chat = await this.chatService.createChat(req.user.userId, chatData);

      const response: ApiResponse<Chat> = {
        success: true,
        data: chat,
        message: 'Chat created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Create chat failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to create chat',
      });
    }
  };

  /**
   * Send message to chat
   */
  sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const messageData: SendMessageRequest = req.body;
      const message = await this.chatService.sendMessage(req.user.userId, messageData);

      const response: ApiResponse<Message> = {
        success: true,
        data: message,
        message: 'Message sent successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Send message failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to send message',
      });
    }
  };

  /**
   * Get chat messages
   */
  getChatMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { chatId } = req.params;
      const pagination = PaginationSchema.parse(req.query);
      
      const messages = await this.chatService.getChatMessages(
        chatId,
        req.user.userId,
        pagination
      );

      const response: ApiResponse<PaginatedResponse<Message>> = {
        success: true,
        data: messages,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get chat messages failed', { 
        error: (error as Error).message, 
        userId: req.user?.userId,
        chatId: req.params.chatId 
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to get messages',
      });
    }
  };

  /**
   * Get user's chats
   */
  getUserChats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const pagination = PaginationSchema.parse(req.query);
      const chats = await this.chatService.getUserChats(req.user.userId, pagination);

      const response: ApiResponse<typeof chats> = {
        success: true,
        data: chats,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get user chats failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to get chats',
      });
    }
  };

  /**
   * Edit message
   */
  editMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { messageId } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Message content is required',
        });
        return;
      }

      const updatedMessage = await this.chatService.editMessage(
        messageId,
        req.user.userId,
        content
      );

      const response: ApiResponse<Message> = {
        success: true,
        data: updatedMessage,
        message: 'Message edited successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Edit message failed', { 
        error: (error as Error).message, 
        userId: req.user?.userId,
        messageId: req.params.messageId 
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to edit message',
      });
    }
  };

  /**
   * Delete message
   */
  deleteMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { messageId } = req.params;
      await this.chatService.deleteMessage(messageId, req.user.userId);

      const response: ApiResponse<never> = {
        success: true,
        message: 'Message deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Delete message failed', { 
        error: (error as Error).message, 
        userId: req.user?.userId,
        messageId: req.params.messageId 
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to delete message',
      });
    }
  };

  /**
   * Mark message as read
   */
  markMessageAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { messageId } = req.params;
      await this.chatService.markMessageAsRead(messageId, req.user.userId);

      const response: ApiResponse<never> = {
        success: true,
        message: 'Message marked as read',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Mark message as read failed', { 
        error: (error as Error).message, 
        userId: req.user?.userId,
        messageId: req.params.messageId 
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to mark message as read',
      });
    }
  };

  /**
   * Health check
   */
  health = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      message: 'Chat service is healthy',
      timestamp: new Date().toISOString(),
      service: 'chat-service',
      version: '0.1.0',
    });
  };
}
