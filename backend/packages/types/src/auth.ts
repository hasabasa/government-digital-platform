import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const UserRoleSchema = z.enum([
  'admin',
  'manager',
  'employee'
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

// Email/password login
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: UserRoleSchema,
  }),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const SessionSchema = BaseEntitySchema.extend({
  userId: z.string().uuid(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.date(),
  isActive: z.boolean().default(true),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type Session = z.infer<typeof SessionSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
