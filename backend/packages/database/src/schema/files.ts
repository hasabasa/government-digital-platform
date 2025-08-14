import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const fileTypeEnum = pgEnum('file_type', ['image', 'video', 'audio', 'document', 'archive', 'other']);
export const virusScanStatusEnum = pgEnum('virus_scan_status', ['pending', 'clean', 'infected', 'error']);
export const filePermissionEnum = pgEnum('file_permission', ['read', 'write', 'delete']);

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
  type: fileTypeEnum('type').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  previewUrl: text('preview_url'),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  isPublic: boolean('is_public').default(false),
  metadata: jsonb('metadata'),
  tags: jsonb('tags').default([]),
  description: text('description'),
  checksum: varchar('checksum', { length: 64 }).notNull(),
  virusScanStatus: virusScanStatusEnum('virus_scan_status').default('pending'),
  isEncrypted: boolean('is_encrypted').default(false),
  encryptionKey: text('encryption_key'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const filePermissions = pgTable('file_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id'),
  permission: filePermissionEnum('permission').notNull(),
  grantedBy: uuid('granted_by').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
