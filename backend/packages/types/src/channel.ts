import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const ChannelTypeSchema = z.enum(['public', 'private', 'announcement']);

export type ChannelType = z.infer<typeof ChannelTypeSchema>;

export const ChannelSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: ChannelTypeSchema,
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
  ownerId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  isVerified: z.boolean().default(false),
  subscriberCount: z.number().default(0),
  messageCount: z.number().default(0),
  tags: z.array(z.string()).default([]),
  settings: z.object({
    allowComments: z.boolean().default(true),
    allowReactions: z.boolean().default(true),
    moderationEnabled: z.boolean().default(false),
    slowMode: z.number().default(0), // seconds
    memberRole: z.enum(['admin', 'moderator', 'subscriber']).default('subscriber'),
  }),
  lastPostAt: z.date().optional(),
});

export type Channel = z.infer<typeof ChannelSchema>;

export const ChannelSubscriptionSchema = BaseEntitySchema.extend({
  channelId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'subscriber']).default('subscriber'),
  notifications: z.boolean().default(true),
  joinedAt: z.date(),
});

export type ChannelSubscription = z.infer<typeof ChannelSubscriptionSchema>;

export const ChannelPostSchema = BaseEntitySchema.extend({
  channelId: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1),
  fileIds: z.array(z.string().uuid()).default([]),
  isPinned: z.boolean().default(false),
  isScheduled: z.boolean().default(false),
  scheduledAt: z.date().optional(),
  publishedAt: z.date().optional(),
  viewCount: z.number().default(0),
  reactionCount: z.number().default(0),
  commentCount: z.number().default(0),
  tags: z.array(z.string()).default([]),
});

export type ChannelPost = z.infer<typeof ChannelPostSchema>;

export const CreateChannelRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: ChannelTypeSchema,
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
});

export type CreateChannelRequest = z.infer<typeof CreateChannelRequestSchema>;
