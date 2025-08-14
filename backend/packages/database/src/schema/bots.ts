import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const botTypeEnum = pgEnum('bot_type', ['service', 'integration', 'assistant', 'moderation']);
export const botCommandExecutionStatusEnum = pgEnum('bot_command_execution_status', ['pending', 'processing', 'completed', 'failed']);

export const bots = pgTable('bots', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  description: text('description'),
  type: botTypeEnum('type').notNull(),
  avatar: text('avatar'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),
  token: text('token').notNull(),
  webhookUrl: text('webhook_url'),
  commands: jsonb('commands').default([]),
  permissions: jsonb('permissions'),
  settings: jsonb('settings'),
  statistics: jsonb('statistics').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const botCommandExecutions = pgTable('bot_command_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  botId: uuid('bot_id').notNull().references(() => bots.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chatId: uuid('chat_id').notNull(),
  command: varchar('command', { length: 100 }).notNull(),
  parameters: jsonb('parameters').default({}),
  status: botCommandExecutionStatusEnum('status').default('pending'),
  response: text('response'),
  error: text('error'),
  executionTime: integer('execution_time'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
