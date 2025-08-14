import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const UserRoleSchema = z.enum([
  'admin',
  'moderator',
  'user',
  'government_official',
  'department_head',
  'citizen'
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

export const LoginRequestSchema = z.object({
  digitalSignature: z.string().min(1),
  publicKey: z.string().min(1),
  timestamp: z.number(),
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

export const DigitalSignatureSchema = z.object({
  certificate: z.string(),
  signature: z.string(),
  timestamp: z.number(),
  algorithm: z.string().default('GOST_3410_2012_256'),
});

export type DigitalSignature = z.infer<typeof DigitalSignatureSchema>;
