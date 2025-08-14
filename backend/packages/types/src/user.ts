import { z } from 'zod';
import { BaseEntitySchema } from './common';
import { UserRoleSchema } from './auth';

export const UserStatusSchema = z.enum(['active', 'inactive', 'suspended', 'pending']);

export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = BaseEntitySchema.extend({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema.default('pending'),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  organization: z.string().optional(),
  digitalCertificate: z.string().optional(),
  lastLoginAt: z.date().optional(),
  isOnline: z.boolean().default(false),
  bio: z.string().max(500).optional(),
  preferences: z.object({
    language: z.string().default('ru'),
    timezone: z.string().default('Europe/Moscow'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      desktop: z.boolean().default(true),
    }),
    privacy: z.object({
      showOnlineStatus: z.boolean().default(true),
      showLastSeen: z.boolean().default(true),
      allowDirectMessages: z.boolean().default(true),
    }),
  }).optional(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  organization: z.string().optional(),
  digitalCertificate: z.string(),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateUserRequestSchema = CreateUserRequestSchema.partial().extend({
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export const ContactSchema = BaseEntitySchema.extend({
  userId: z.string().uuid(),
  contactUserId: z.string().uuid(),
  status: z.enum(['pending', 'accepted', 'blocked']).default('pending'),
  note: z.string().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;

export const AddContactRequestSchema = z.object({
  contactUserId: z.string().uuid(),
  note: z.string().optional(),
});

export type AddContactRequest = z.infer<typeof AddContactRequestSchema>;
