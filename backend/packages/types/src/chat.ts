import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const ChatTypeSchema = z.enum(['direct', 'group', 'channel']);

export type ChatType = z.infer<typeof ChatTypeSchema>;

export const MessageTypeSchema = z.enum(['text', 'file', 'image', 'video', 'audio', 'system']);

export type MessageType = z.infer<typeof MessageTypeSchema>;

export const ChatSchema = BaseEntitySchema.extend({
  type: ChatTypeSchema,
  name: z.string().optional(),
  description: z.string().optional(),
  avatar: z.string().url().optional(),
  isPrivate: z.boolean().default(false),
  encryptionKey: z.string().optional(),
  lastMessageAt: z.date().optional(),
  createdBy: z.string().uuid(),
  participantCount: z.number().default(0),
});

export type Chat = z.infer<typeof ChatSchema>;

export const MessageSchema = BaseEntitySchema.extend({
  chatId: z.string().uuid(),
  senderId: z.string().uuid(),
  type: MessageTypeSchema.default('text'),
  content: z.string(),
  encryptedContent: z.string().optional(),
  fileId: z.string().uuid().optional(),
  replyToId: z.string().uuid().optional(),
  isEdited: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  readBy: z.array(z.object({
    userId: z.string().uuid(),
    readAt: z.date(),
  })).default([]),
  metadata: z.record(z.any()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ChatParticipantSchema = BaseEntitySchema.extend({
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'member']).default('member'),
  joinedAt: z.date(),
  lastReadMessageId: z.string().uuid().optional(),
  notifications: z.boolean().default(true),
  isBlocked: z.boolean().default(false),
});

export type ChatParticipant = z.infer<typeof ChatParticipantSchema>;

export const SendMessageRequestSchema = z.object({
  chatId: z.string().uuid(),
  type: MessageTypeSchema.default('text'),
  content: z.string().min(1),
  fileId: z.string().uuid().optional(),
  replyToId: z.string().uuid().optional(),
  encrypt: z.boolean().default(true),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

export const CreateChatRequestSchema = z.object({
  type: ChatTypeSchema,
  name: z.string().optional(),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
  participantIds: z.array(z.string().uuid()).min(1),
});

export type CreateChatRequest = z.infer<typeof CreateChatRequestSchema>;

export const WebSocketEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message:new'),
    data: MessageSchema,
  }),
  z.object({
    type: z.literal('message:update'),
    data: MessageSchema,
  }),
  z.object({
    type: z.literal('message:delete'),
    data: z.object({
      messageId: z.string().uuid(),
      chatId: z.string().uuid(),
    }),
  }),
  z.object({
    type: z.literal('chat:delete'),
    data: z.object({
      chatId: z.string().uuid(),
    }),
  }),
  z.object({
    type: z.literal('user:typing'),
    data: z.object({
      userId: z.string().uuid(),
      chatId: z.string().uuid(),
    }),
  }),
  z.object({
    type: z.literal('user:online'),
    data: z.object({
      userId: z.string().uuid(),
      isOnline: z.boolean(),
    }),
  }),
]);

export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>;
