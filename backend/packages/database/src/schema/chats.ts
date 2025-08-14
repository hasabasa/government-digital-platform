import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const chatTypeEnum = pgEnum('chat_type', ['direct', 'group', 'channel']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'file', 'image', 'video', 'audio', 'system']);
export const participantRoleEnum = pgEnum('participant_role', ['admin', 'moderator', 'member']);

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: chatTypeEnum('type').notNull(),
  name: varchar('name', { length: 100 }),
  description: text('description'),
  avatar: text('avatar'),
  isPrivate: boolean('is_private').default(false),
  encryptionKey: text('encryption_key'),
  lastMessageAt: timestamp('last_message_at'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  participantCount: integer('participant_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chatParticipants = pgTable('chat_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: participantRoleEnum('role').default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  lastReadMessageId: uuid('last_read_message_id'),
  notifications: boolean('notifications').default(true),
  isBlocked: boolean('is_blocked').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: messageTypeEnum('type').default('text'),
  content: text('content').notNull(),
  encryptedContent: text('encrypted_content'),
  fileId: uuid('file_id'),
  replyToId: uuid('reply_to_id'),
  isEdited: boolean('is_edited').default(false),
  isDeleted: boolean('is_deleted').default(false),
  readBy: jsonb('read_by').default([]),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
