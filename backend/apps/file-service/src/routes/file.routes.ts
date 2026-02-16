import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { PaginationSchema } from '@cube-demper/types';
import { z } from 'zod';

const router = Router();
const fileController = new FileController();

// Validation schemas
const FileIdParamSchema = z.object({
  fileId: z.string().uuid(),
});

const FileUrlQuerySchema = z.object({
  expiresIn: z.string().optional(),
});

// Public routes
router.get('/health', fileController.health);

// Protected routes - require authentication
router.use(AuthMiddleware.authenticate);

// File upload
router.post(
  '/upload',
  fileController.uploadMiddleware,
  fileController.uploadFile
);

router.post(
  '/upload-multiple',
  fileController.uploadMultipleMiddleware,
  fileController.uploadMultipleFiles
);

// File operations
router.get(
  '/user',
  ValidationMiddleware.validateQuery(PaginationSchema.extend({
    type: z.string().optional(),
  })),
  fileController.getUserFiles
);

router.get(
  '/:fileId',
  ValidationMiddleware.validateParams(FileIdParamSchema),
  fileController.getFileInfo
);

router.get(
  '/:fileId/download',
  ValidationMiddleware.validateParams(FileIdParamSchema),
  fileController.downloadFile
);

router.get(
  '/:fileId/preview',
  ValidationMiddleware.validateParams(FileIdParamSchema),
  ValidationMiddleware.validateQuery(z.object({
    size: z.enum(['small', 'medium', 'large']).optional(),
  })),
  fileController.getFilePreview
);

router.post(
  '/:fileId/url',
  ValidationMiddleware.validateParams(FileIdParamSchema),
  ValidationMiddleware.validateQuery(FileUrlQuerySchema),
  fileController.generateFileUrl
);

router.delete(
  '/:fileId',
  ValidationMiddleware.validateParams(FileIdParamSchema),
  fileController.deleteFile
);

export { router as fileRoutes };
