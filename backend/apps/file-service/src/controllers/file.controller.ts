import { Request, Response } from 'express';
import { FileService } from '../services/file.service';
import { logger } from '../utils/logger';
import {
  UploadFileRequest,
  PaginationSchema,
  ApiResponse,
  File,
  PaginatedResponse,
} from '@gov-platform/types';
import multer from 'multer';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFiles,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

export class FileController {
  private fileService = new FileService();

  /**
   * Multer middleware for single file upload
   */
  uploadMiddleware = upload.single('file');

  /**
   * Multer middleware for multiple file upload
   */
  uploadMultipleMiddleware = upload.array('files', config.upload.maxFiles);

  /**
   * Upload single file
   */
  uploadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file provided',
        });
        return;
      }

      const uploadData: Partial<UploadFileRequest> = {
        description: req.body.description,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        isPublic: req.body.isPublic === 'true',
      };

      const file = await this.fileService.uploadFile(req.file, req.user.userId, uploadData);

      const response: ApiResponse<File> = {
        success: true,
        data: file,
        message: 'File uploaded successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Upload file failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to upload file',
      });
    }
  };

  /**
   * Upload multiple files
   */
  uploadMultipleFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files provided',
        });
        return;
      }

      const uploadData: Partial<UploadFileRequest> = {
        description: req.body.description,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        isPublic: req.body.isPublic === 'true',
      };

      const uploadedFiles: File[] = [];
      const errors: string[] = [];

      // Upload files sequentially to avoid overwhelming the system
      for (const file of files) {
        try {
          const uploadedFile = await this.fileService.uploadFile(file, req.user.userId, uploadData);
          uploadedFiles.push(uploadedFile);
        } catch (error) {
          errors.push(`${file.originalname}: ${(error as Error).message}`);
        }
      }

      const response: ApiResponse<{ files: File[]; errors: string[] }> = {
        success: errors.length === 0,
        data: {
          files: uploadedFiles,
          errors,
        },
        message: `${uploadedFiles.length} files uploaded successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      };

      res.status(errors.length === files.length ? 400 : 201).json(response);
    } catch (error) {
      logger.error('Upload multiple files failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to upload files',
      });
    }
  };

  /**
   * Download file
   */
  downloadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      const { buffer, filename, mimeType } = await this.fileService.downloadFile(
        fileId,
        req.user?.userId
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Length', buffer.length);
      
      res.send(buffer);
    } catch (error) {
      logger.error('Download file failed', { 
        error: (error as Error).message, 
        fileId: req.params.fileId,
        userId: req.user?.userId 
      });
      
      res.status((error as Error).message === 'File not found' ? 404 : 
                 (error as Error).message === 'Access denied' ? 403 : 500).json({
        success: false,
        error: (error as Error).message || 'Failed to download file',
      });
    }
  };

  /**
   * Get file info
   */
  getFileInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      const file = await this.fileService.getFileById(fileId, req.user?.userId);

      if (!file) {
        res.status(404).json({
          success: false,
          error: 'File not found',
        });
        return;
      }

      const response: ApiResponse<File> = {
        success: true,
        data: file,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get file info failed', { 
        error: (error as Error).message, 
        fileId: req.params.fileId,
        userId: req.user?.userId 
      });
      
      res.status((error as Error).message === 'Access denied' ? 403 : 500).json({
        success: false,
        error: (error as Error).message || 'Failed to get file info',
      });
    }
  };

  /**
   * Get file preview/thumbnail
   */
  getFilePreview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      const { size = 'medium' } = req.query;
      
      const { buffer, mimeType } = await this.fileService.getFilePreview(
        fileId,
        size as 'small' | 'medium' | 'large'
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      res.send(buffer);
    } catch (error) {
      logger.error('Get file preview failed', { 
        error: (error as Error).message, 
        fileId: req.params.fileId,
        userId: req.user?.userId 
      });
      
      res.status((error as Error).message === 'File not found' ? 404 : 500).json({
        success: false,
        error: (error as Error).message || 'Failed to get file preview',
      });
    }
  };

  /**
   * Delete file
   */
  deleteFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { fileId } = req.params;
      await this.fileService.deleteFile(fileId, req.user.userId);

      const response: ApiResponse<never> = {
        success: true,
        message: 'File deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Delete file failed', { 
        error: (error as Error).message, 
        fileId: req.params.fileId,
        userId: req.user?.userId 
      });
      
      res.status((error as Error).message === 'File not found' ? 404 : 
                 (error as Error).message === 'Access denied' ? 403 : 500).json({
        success: false,
        error: (error as Error).message || 'Failed to delete file',
      });
    }
  };

  /**
   * Get user files
   */
  getUserFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const pagination = PaginationSchema.parse(req.query);
      const { type } = req.query;
      
      const files = await this.fileService.getUserFiles(
        req.user.userId,
        pagination,
        type as string
      );

      const response: ApiResponse<PaginatedResponse<File>> = {
        success: true,
        data: files,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get user files failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to get user files',
      });
    }
  };

  /**
   * Generate file URL
   */
  generateFileUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      const { expiresIn } = req.query;
      
      const url = await this.fileService.generateFileUrl(
        fileId,
        req.user?.userId,
        expiresIn ? parseInt(expiresIn as string) : undefined
      );

      const response: ApiResponse<{ url: string; expiresIn: number }> = {
        success: true,
        data: {
          url,
          expiresIn: parseInt(expiresIn as string) || config.security.signedUrlExpiration,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Generate file URL failed', { 
        error: (error as Error).message, 
        fileId: req.params.fileId,
        userId: req.user?.userId 
      });
      
      res.status((error as Error).message === 'File not found' ? 404 : 
                 (error as Error).message === 'Access denied' ? 403 : 500).json({
        success: false,
        error: (error as Error).message || 'Failed to generate file URL',
      });
    }
  };

  /**
   * Health check
   */
  health = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      message: 'File service is healthy',
      timestamp: new Date().toISOString(),
      service: 'file-service',
      version: '0.1.0',
    });
  };
}
