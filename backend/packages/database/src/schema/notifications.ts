import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notificationTypeEnum = pgEnum('notification_type', [
  'message',
  'mention',
  'call',
  'system',
  'security',
  'update',
  'reminder'
]);

export const notificationChannelEnum = pgEnum('notification_channel', ['push', 'email', 'sms', 'in_app']);
export const notificationPriorityEnum = pgEnum('notification_priority', ['low', 'normal', 'high', 'urgent']);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  priority: notificationPriorityEnum('priority').default('normal'),
  channels: jsonb('channels').default(['in_app']),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  sentAt: timestamp('sent_at'),
  scheduledFor: timestamp('scheduled_for'),
  expiresAt: timestamp('expires_at'),
  actionUrl: varchar('action_url'),
  actionText: varchar('action_text'),
  imageUrl: varchar('image_url'),
  sound: varchar('sound'),
  relatedEntityType: varchar('related_entity_type'),
  relatedEntityId: uuid('related_entity_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  preferences: jsonb('preferences').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  keys: jsonb('keys').notNull(),
  deviceType: varchar('device_type', { length: 20 }).notNull(),
  deviceId: varchar('device_id'),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  subject: varchar('subject', { length: 200 }).notNull(),
  template: text('template').notNull(),
  type: notificationTypeEnum('type').notNull(),
  variables: jsonb('variables').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
