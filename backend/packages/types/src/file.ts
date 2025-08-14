import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const FileTypeSchema = z.enum([
  'image',
  'video',
  'audio',
  'document',
  'archive',
  'other'
]);

export type FileType = z.infer<typeof FileTypeSchema>;

export const FileSchema = BaseEntitySchema.extend({
  filename: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string(),
  size: z.number().positive(),
  type: FileTypeSchema,
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  uploadedBy: z.string().uuid(),
  isPublic: z.boolean().default(false),
  metadata: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    pages: z.number().optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
  checksum: z.string(),
  virusScanStatus: z.enum(['pending', 'clean', 'infected', 'error']).default('pending'),
  isEncrypted: z.boolean().default(false),
  encryptionKey: z.string().optional(),
});

export type File = z.infer<typeof FileSchema>;

export const UploadFileRequestSchema = z.object({
  file: z.any(), // Will be handled by multer
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  encrypt: z.boolean().default(true),
});

export type UploadFileRequest = z.infer<typeof UploadFileRequestSchema>;

export const FilePermissionSchema = BaseEntitySchema.extend({
  fileId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  roleId: z.string().uuid().optional(),
  permission: z.enum(['read', 'write', 'delete']),
  grantedBy: z.string().uuid(),
  expiresAt: z.date().optional(),
});

export type FilePermission = z.infer<typeof FilePermissionSchema>;
