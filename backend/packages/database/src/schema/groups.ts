import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const groupTypeEnum = pgEnum('group_type', ['open', 'closed', 'secret']);
export const groupMemberRoleEnum = pgEnum('group_member_role', ['admin', 'moderator', 'member']);
export const groupMemberStatusEnum = pgEnum('group_member_status', ['active', 'banned', 'pending']);

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: groupTypeEnum('type').notNull(),
  avatar: text('avatar'),
  banner: text('banner'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  categoryId: uuid('category_id'),
  memberCount: integer('member_count').default(0),
  topicCount: integer('topic_count').default(0),
  messageCount: integer('message_count').default(0),
  tags: jsonb('tags').default([]),
  rules: text('rules'),
  settings: jsonb('settings'),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const groupMemberships = pgTable('group_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: groupMemberRoleEnum('role').default('member'),
  status: groupMemberStatusEnum('status').default('active'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  invitedBy: uuid('invited_by').references(() => users.id),
  notifications: boolean('notifications').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const groupTopics = pgTable('group_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  fileIds: jsonb('file_ids').default([]),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  viewCount: integer('view_count').default(0),
  replyCount: integer('reply_count').default(0),
  lastReplyAt: timestamp('last_reply_at'),
  lastReplyBy: uuid('last_reply_by').references(() => users.id),
  tags: jsonb('tags').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const groupTopicReplies = pgTable('group_topic_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  topicId: uuid('topic_id').notNull().references(() => groupTopics.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  fileIds: jsonb('file_ids').default([]),
  replyToId: uuid('reply_to_id'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
