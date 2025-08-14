import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const channelTypeEnum = pgEnum('channel_type', ['public', 'private', 'announcement']);

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: channelTypeEnum('type').notNull(),
  avatar: text('avatar'),
  banner: text('banner'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  categoryId: uuid('category_id'),
  isVerified: boolean('is_verified').default(false),
  subscriberCount: integer('subscriber_count').default(0),
  messageCount: integer('message_count').default(0),
  tags: jsonb('tags').default([]),
  settings: jsonb('settings'),
  lastPostAt: timestamp('last_post_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const channelSubscriptions = pgTable('channel_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).default('subscriber'),
  notifications: boolean('notifications').default(true),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const channelPosts = pgTable('channel_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }),
  content: text('content').notNull(),
  fileIds: jsonb('file_ids').default([]),
  isPinned: boolean('is_pinned').default(false),
  isScheduled: boolean('is_scheduled').default(false),
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  viewCount: integer('view_count').default(0),
  reactionCount: integer('reaction_count').default(0),
  commentCount: integer('comment_count').default(0),
  tags: jsonb('tags').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
