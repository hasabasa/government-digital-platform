import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const GroupTypeSchema = z.enum(['open', 'closed', 'secret']);

export type GroupType = z.infer<typeof GroupTypeSchema>;

export const GroupSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: GroupTypeSchema,
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
  ownerId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  memberCount: z.number().default(0),
  topicCount: z.number().default(0),
  messageCount: z.number().default(0),
  tags: z.array(z.string()).default([]),
  rules: z.string().max(2000).optional(),
  settings: z.object({
    requireApproval: z.boolean().default(false),
    allowInvites: z.boolean().default(true),
    moderationEnabled: z.boolean().default(true),
    slowMode: z.number().default(0),
  }),
  lastActivityAt: z.date().optional(),
});

export type Group = z.infer<typeof GroupSchema>;

export const GroupMembershipSchema = BaseEntitySchema.extend({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'member']).default('member'),
  status: z.enum(['active', 'banned', 'pending']).default('active'),
  joinedAt: z.date(),
  invitedBy: z.string().uuid().optional(),
  notifications: z.boolean().default(true),
});

export type GroupMembership = z.infer<typeof GroupMembershipSchema>;

export const GroupTopicSchema = BaseEntitySchema.extend({
  groupId: z.string().uuid(),
  authorId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  fileIds: z.array(z.string().uuid()).default([]),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  viewCount: z.number().default(0),
  replyCount: z.number().default(0),
  lastReplyAt: z.date().optional(),
  lastReplyBy: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
});

export type GroupTopic = z.infer<typeof GroupTopicSchema>;

export const GroupTopicReplySchema = BaseEntitySchema.extend({
  topicId: z.string().uuid(),
  authorId: z.string().uuid(),
  content: z.string().min(1),
  fileIds: z.array(z.string().uuid()).default([]),
  replyToId: z.string().uuid().optional(),
  isDeleted: z.boolean().default(false),
});

export type GroupTopicReply = z.infer<typeof GroupTopicReplySchema>;

export const CreateGroupRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: GroupTypeSchema,
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  rules: z.string().max(2000).optional(),
});

export type CreateGroupRequest = z.infer<typeof CreateGroupRequestSchema>;
