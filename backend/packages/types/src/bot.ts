import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const BotTypeSchema = z.enum(['service', 'integration', 'assistant', 'moderation']);

export type BotType = z.infer<typeof BotTypeSchema>;

export const BotSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  description: z.string().max(500).optional(),
  type: BotTypeSchema,
  avatar: z.string().url().optional(),
  ownerId: z.string().uuid(),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  token: z.string().min(32),
  webhookUrl: z.string().url().optional(),
  commands: z.array(z.object({
    command: z.string().min(1),
    description: z.string().min(1),
    parameters: z.array(z.object({
      name: z.string().min(1),
      type: z.enum(['string', 'number', 'boolean']),
      required: z.boolean().default(false),
      description: z.string().optional(),
    })).default([]),
  })).default([]),
  permissions: z.object({
    canReadMessages: z.boolean().default(true),
    canSendMessages: z.boolean().default(true),
    canDeleteMessages: z.boolean().default(false),
    canManageUsers: z.boolean().default(false),
    canAccessFiles: z.boolean().default(false),
  }),
  settings: z.object({
    responseTimeout: z.number().default(30000),
    rateLimitPerMinute: z.number().default(60),
    enabledInGroups: z.boolean().default(true),
    enabledInChannels: z.boolean().default(true),
    enabledInDirectChats: z.boolean().default(true),
  }),
  statistics: z.object({
    totalCommands: z.number().default(0),
    totalUsers: z.number().default(0),
    lastUsedAt: z.date().optional(),
  }).default({}),
});

export type Bot = z.infer<typeof BotSchema>;

export const BotCommandExecutionSchema = BaseEntitySchema.extend({
  botId: z.string().uuid(),
  userId: z.string().uuid(),
  chatId: z.string().uuid(),
  command: z.string().min(1),
  parameters: z.record(z.any()).default({}),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  response: z.string().optional(),
  error: z.string().optional(),
  executionTime: z.number().optional(),
});

export type BotCommandExecution = z.infer<typeof BotCommandExecutionSchema>;

export const CreateBotRequestSchema = z.object({
  name: z.string().min(1).max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  description: z.string().max(500).optional(),
  type: BotTypeSchema,
  webhookUrl: z.string().url().optional(),
  commands: z.array(z.object({
    command: z.string().min(1),
    description: z.string().min(1),
    parameters: z.array(z.object({
      name: z.string().min(1),
      type: z.enum(['string', 'number', 'boolean']),
      required: z.boolean().default(false),
      description: z.string().optional(),
    })).default([]),
  })).default([]),
});

export type CreateBotRequest = z.infer<typeof CreateBotRequestSchema>;

export const BotWebhookEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message'),
    data: z.object({
      messageId: z.string().uuid(),
      chatId: z.string().uuid(),
      userId: z.string().uuid(),
      content: z.string(),
      timestamp: z.date(),
    }),
  }),
  z.object({
    type: z.literal('command'),
    data: z.object({
      executionId: z.string().uuid(),
      command: z.string(),
      parameters: z.record(z.any()),
      userId: z.string().uuid(),
      chatId: z.string().uuid(),
    }),
  }),
  z.object({
    type: z.literal('user_joined'),
    data: z.object({
      userId: z.string().uuid(),
      chatId: z.string().uuid(),
      timestamp: z.date(),
    }),
  }),
]);

export type BotWebhookEvent = z.infer<typeof BotWebhookEventSchema>;
