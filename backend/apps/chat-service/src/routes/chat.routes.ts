import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import {
  CreateChatRequestSchema,
  SendMessageRequestSchema,
  PaginationSchema,
} from '@gov-platform/types';
import { z } from 'zod';

const router = Router();
const chatController = new ChatController();

// Validation schemas
const ChatIdParamSchema = z.object({
  chatId: z.string().uuid(),
});

const MessageIdParamSchema = z.object({
  messageId: z.string().uuid(),
});

const EditMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

// Public routes
router.get('/health', chatController.health);

// Protected routes - require authentication
router.use(AuthMiddleware.authenticate);

// Chat management
router.post(
  '/',
  ValidationMiddleware.validateBody(CreateChatRequestSchema),
  chatController.createChat
);

router.get(
  '/user',
  ValidationMiddleware.validateQuery(PaginationSchema),
  chatController.getUserChats
);

// Message operations
router.post(
  '/messages',
  ValidationMiddleware.validateBody(SendMessageRequestSchema),
  chatController.sendMessage
);

router.get(
  '/:chatId/messages',
  ValidationMiddleware.validateParams(ChatIdParamSchema),
  ValidationMiddleware.validateQuery(PaginationSchema),
  chatController.getChatMessages
);

router.put(
  '/messages/:messageId',
  ValidationMiddleware.validateParams(MessageIdParamSchema),
  ValidationMiddleware.validateBody(EditMessageSchema),
  chatController.editMessage
);

router.delete(
  '/messages/:messageId',
  ValidationMiddleware.validateParams(MessageIdParamSchema),
  chatController.deleteMessage
);

router.post(
  '/messages/:messageId/read',
  ValidationMiddleware.validateParams(MessageIdParamSchema),
  chatController.markMessageAsRead
);

export { router as chatRoutes };
