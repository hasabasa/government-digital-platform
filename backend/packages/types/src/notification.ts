import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const NotificationTypeSchema = z.enum([
  'message',
  'mention',
  'call',
  'system',
  'security',
  'update',
  'reminder'
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationChannelSchema = z.enum(['push', 'email', 'sms', 'in_app']);

export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const NotificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

export type NotificationPriority = z.infer<typeof NotificationPrioritySchema>;

export const NotificationSchema = BaseEntitySchema.extend({
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
  priority: NotificationPrioritySchema.default('normal'),
  channels: z.array(NotificationChannelSchema).default(['in_app']),
  isRead: z.boolean().default(false),
  readAt: z.date().optional(),
  sentAt: z.date().optional(),
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional(),
  actionUrl: z.string().url().optional(),
  actionText: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sound: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().uuid().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationPreferencesSchema = z.object({
  userId: z.string().uuid(),
  preferences: z.object({
    push: z.object({
      enabled: z.boolean().default(true),
      quiet_hours: z.object({
        enabled: z.boolean().default(false),
        start: z.string().default('22:00'),
        end: z.string().default('08:00'),
      }),
      types: z.record(NotificationTypeSchema, z.boolean()).default({}),
    }),
    email: z.object({
      enabled: z.boolean().default(true),
      digest: z.boolean().default(true),
      frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).default('daily'),
      types: z.record(NotificationTypeSchema, z.boolean()).default({}),
    }),
    sms: z.object({
      enabled: z.boolean().default(false),
      types: z.record(NotificationTypeSchema, z.boolean()).default({}),
    }),
    in_app: z.object({
      enabled: z.boolean().default(true),
      sound: z.boolean().default(true),
      badge: z.boolean().default(true),
      types: z.record(NotificationTypeSchema, z.boolean()).default({}),
    }),
  }),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

export const CreateNotificationRequestSchema = z.object({
  userId: z.string().uuid().optional(), // Optional for broadcast
  userIds: z.array(z.string().uuid()).optional(), // For multiple users
  type: NotificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
  priority: NotificationPrioritySchema.default('normal'),
  channels: z.array(NotificationChannelSchema).default(['in_app']),
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional(),
  actionUrl: z.string().url().optional(),
  actionText: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sound: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().uuid().optional(),
});

export type CreateNotificationRequest = z.infer<typeof CreateNotificationRequestSchema>;

export const PushSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  deviceType: z.enum(['web', 'ios', 'android']),
  deviceId: z.string().optional(),
  userAgent: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;

export const EmailTemplateSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  subject: z.string().min(1),
  template: z.string().min(1),
  type: NotificationTypeSchema,
  variables: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
