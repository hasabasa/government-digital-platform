import { DatabaseConnection } from '@gov-platform/database';
import { files, filePermissions } from '@gov-platform/database';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import {
  File,
  UploadFileRequest,
  FilePermission,
  PaginatedResponse,
  Pagination,
} from '@gov-platform/types';
import { logger } from '../utils/logger';
import { StorageService } from './storage.service';
import { ProcessingService } from './processing.service';
import { CacheService } from './cache.service';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export class FileService {
  private db = DatabaseConnection.getInstance().getDb();
  private storageService = new StorageService();
  private processingService = new ProcessingService();
  private cacheService = new CacheService();

  /**
   * Upload file
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    uploadData: Partial<UploadFileRequest>
  ): Promise<File> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique file key
      const fileKey = this.storageService.generateFileKey(userId, file.originalname);
      
      // Calculate checksum
      const checksum = this.storageService.calculateChecksum(file.buffer);

      // Check for duplicate files
      const existingFile = await this.findFileByChecksum(checksum, userId);
      if (existingFile) {
        logger.info('Duplicate file detected, returning existing', {
          existingFileId: existingFile.id,
          checksum,
        });
        return existingFile;
      }

      // Upload to S3
      const { url, etag } = await this.storageService.uploadFile(file, fileKey, {
        'user-id': userId,
        'checksum': checksum,
      });

      // Determine file type
      const fileType = this.determineFileType(file.mimetype);

      // Create file record
      const newFile = {
        id: uuidv4(),
        filename: fileKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type: fileType,
        url,
        uploadedBy: userId,
        isPublic: uploadData.isPublic || false,
        tags: uploadData.tags || [],
        description: uploadData.description,
        checksum,
        virusScanStatus: 'pending' as const,
        isEncrypted: config.security.encryptionEnabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [createdFile] = await this.db
        .insert(files)
        .values(newFile)
        .returning();

      // Process file asynchronously (thumbnails, previews, etc.)
      this.processFileAsync(createdFile, file);

      // Cache file info
      await this.cacheService.cacheFile(createdFile);

      logger.info('File uploaded successfully', {
        fileId: createdFile.id,
        filename: file.originalname,
        size: file.size,
        type: fileType,
        userId,
      });

      return createdFile as any;
    } catch (error) {
      logger.error('File upload failed', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string, userId?: string): Promise<File | null> {
    try {
      // Try cache first
      const cached = await this.cacheService.getCachedFile(fileId);
      if (cached) {
        return cached;
      }

      const [file] = await this.db
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (!file) {
        return null;
      }

      // Check permissions
      if (userId && !await this.hasFileAccess(fileId, userId, 'read')) {
        throw new Error('Access denied');
      }

      // Cache the file
      await this.cacheService.cacheFile(file);

              return file as any;
    } catch (error) {
      logger.error('Get file by ID failed', { error: (error as Error).message, fileId, userId });
      throw error;
    }
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string, userId?: string): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    try {
      const file = await this.getFileById(fileId, userId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check download permissions
      if (userId && !await this.hasFileAccess(fileId, userId, 'read')) {
        throw new Error('Access denied');
      }

      const buffer = await this.storageService.downloadFile(file.filename);

      logger.info('File downloaded', {
        fileId,
        filename: file.originalName,
        userId,
      });

      return {
        buffer,
        filename: file.originalName,
        mimeType: file.mimeType,
      };
    } catch (error) {
      logger.error('File download failed', { error: (error as Error).message, fileId, userId });
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      const file = await this.getFileById(fileId, userId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check if user owns the file or has delete permission
      if (file.uploadedBy !== userId && !await this.hasFileAccess(fileId, userId, 'delete')) {
        throw new Error('Access denied');
      }

      // Soft delete in database
      await this.db
        .update(files)
        .set({
          updatedAt: new Date(),
          // Add isDeleted field to schema if needed
        })
        .where(eq(files.id, fileId));

      // Delete from S3 (can be done asynchronously)
      setTimeout(async () => {
        try {
          await this.storageService.deleteFile(file.filename);
          
          // Delete thumbnails and previews
          if (file.thumbnailUrl) {
            const thumbnailKey = this.extractKeyFromUrl(file.thumbnailUrl);
            await this.storageService.deleteFile(thumbnailKey);
          }
          
          if (file.previewUrl) {
            const previewKey = this.extractKeyFromUrl(file.previewUrl);
            await this.storageService.deleteFile(previewKey);
          }
        } catch (error) {
          logger.error('Failed to delete file from storage', { 
            error: (error as Error).message, 
            fileId 
          });
        }
      }, 1000);

      // Remove from cache
      await this.cacheService.removeCachedFile(fileId);

      logger.info('File deleted successfully', { fileId, userId });
    } catch (error) {
      logger.error('File deletion failed', { error: (error as Error).message, fileId, userId });
      throw error;
    }
  }

  /**
   * Get file preview/thumbnail
   */
  async getFilePreview(fileId: string, size: 'small' | 'medium' | 'large' = 'medium'): Promise<{
    buffer: Buffer;
    mimeType: string;
  }> {
    try {
      const file = await this.getFileById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check if preview exists
      const previewKey = this.storageService.generateThumbnailKey(file.filename, size);
      
      if (await this.storageService.fileExists(previewKey)) {
        const buffer = await this.storageService.downloadFile(previewKey);
        return {
          buffer,
          mimeType: 'image/jpeg',
        };
      }

      // Generate preview if not exists
      const originalBuffer = await this.storageService.downloadFile(file.filename);
      const previewBuffer = await this.processingService.generateThumbnail(
        originalBuffer,
        file.mimeType,
        size
      );

      // Save preview for future use
      const mockFile = {
        buffer: previewBuffer,
        mimetype: 'image/jpeg',
        originalname: `preview_${size}_${file.originalName}`,
      } as Express.Multer.File;

      await this.storageService.uploadFile(mockFile, previewKey);

      return {
        buffer: previewBuffer,
        mimeType: 'image/jpeg',
      };
    } catch (error) {
      logger.error('Get file preview failed', { error: (error as Error).message, fileId, size });
      throw error;
    }
  }

  /**
   * Get user files with pagination
   */
  async getUserFiles(
    userId: string,
    pagination: Pagination,
    type?: string
  ): Promise<PaginatedResponse<File>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      let whereCondition = eq(files.uploadedBy, userId);
      if (type) {
        whereCondition = and(whereCondition!, eq(files.type, type as any));
      }

      const [filesResult, countResult] = await Promise.all([
        this.db
          .select()
          .from(files)
          .where(whereCondition)
          .orderBy(desc(files.createdAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql<number>`count(*)` })
          .from(files)
          .where(whereCondition)
      ]);

      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: filesResult as any,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Get user files failed', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Generate signed URL for file access
   */
  async generateFileUrl(fileId: string, userId?: string, expiresIn?: number): Promise<string> {
    try {
      const file = await this.getFileById(fileId, userId);
      if (!file) {
        throw new Error('File not found');
      }

      if (userId && !await this.hasFileAccess(fileId, userId, 'read')) {
        throw new Error('Access denied');
      }

      return await this.storageService.generateSignedUrl(file.filename, expiresIn);
    } catch (error) {
      logger.error('Generate file URL failed', { error: (error as Error).message, fileId, userId });
      throw error;
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > config.upload.maxFileSize) {
      throw new Error(`File size exceeds limit of ${config.upload.maxFileSize} bytes`);
    }

    if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }
  }

  /**
   * Determine file type from MIME type
   */
  private determineFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    return 'other';
  }

  /**
   * Find file by checksum
   */
  private async findFileByChecksum(checksum: string, userId: string): Promise<File | null> {
    const [existingFile] = await this.db
      .select()
      .from(files)
      .where(
        and(
          eq(files.checksum, checksum),
          eq(files.uploadedBy, userId)
        )
      )
      .limit(1);

    return (existingFile as any) || null;
  }

  /**
   * Check file access permissions
   */
  private async hasFileAccess(fileId: string, userId: string, permission: 'read' | 'write' | 'delete'): Promise<boolean> {
    // Check if user owns the file
    const [file] = await this.db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (file?.uploadedBy === userId) {
      return true;
    }

    // Check if file is public for read access
    if (permission === 'read' && file?.isPublic) {
      return true;
    }

    // Check explicit permissions
    const [filePermission] = await this.db
      .select()
      .from(filePermissions)
      .where(
        and(
          eq(filePermissions.fileId, fileId),
          eq(filePermissions.userId, userId),
          eq(filePermissions.permission, permission)
        )
      )
      .limit(1);

    return !!filePermission;
  }

  /**
   * Extract S3 key from URL
   */
  private extractKeyFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts.slice(4).join('/'); // Remove protocol, domain, and bucket
  }

  /**
   * Process file asynchronously
   */
  private async processFileAsync(file: File, originalFile: Express.Multer.File): Promise<void> {
    try {
      let thumbnailUrl: string | undefined;
      let previewUrl: string | undefined;

      // Generate thumbnails for images
      if (file.type === 'image') {
        const thumbnail = await this.processingService.generateThumbnail(
          originalFile.buffer,
          file.mimeType,
          'medium'
        );

        const thumbnailKey = this.storageService.generateThumbnailKey(file.filename, 'medium');
        const mockThumbnail = {
          buffer: thumbnail,
          mimetype: 'image/jpeg',
          originalname: `thumbnail_${file.originalName}`,
        } as Express.Multer.File;

        const { url } = await this.storageService.uploadFile(mockThumbnail, thumbnailKey);
        thumbnailUrl = url;
      }

      // Generate video thumbnails
      if (file.type === 'video') {
        const videoThumbnail = await this.processingService.generateVideoThumbnail(
          originalFile.buffer,
          config.videoProcessing.thumbnailTime
        );

        const thumbnailKey = this.storageService.generateThumbnailKey(file.filename, 'video_thumb');
        const mockThumbnail = {
          buffer: videoThumbnail,
          mimetype: 'image/jpeg',
          originalname: `video_thumb_${file.originalName}`,
        } as Express.Multer.File;

        const { url } = await this.storageService.uploadFile(mockThumbnail, thumbnailKey);
        thumbnailUrl = url;
      }

      // Generate document previews
      if (file.type === 'document') {
        const documentPreview = await this.processingService.generateDocumentPreview(
          originalFile.buffer,
          file.mimeType
        );

        if (documentPreview) {
          const previewKey = this.storageService.generateThumbnailKey(file.filename, 'preview');
          const mockPreview = {
            buffer: documentPreview,
            mimetype: 'image/jpeg',
            originalname: `preview_${file.originalName}`,
          } as Express.Multer.File;

          const { url } = await this.storageService.uploadFile(mockPreview, previewKey);
          previewUrl = url;
        }
      }

      // Update file record with generated URLs
      if (thumbnailUrl || previewUrl) {
        await this.db
          .update(files)
          .set({
            thumbnailUrl,
            previewUrl,
            updatedAt: new Date(),
          })
          .where(eq(files.id, file.id));

        // Update cache
        await this.cacheService.removeCachedFile(file.id);
      }

      logger.info('File processing completed', {
        fileId: file.id,
        thumbnailGenerated: !!thumbnailUrl,
        previewGenerated: !!previewUrl,
      });
    } catch (error) {
      logger.error('File processing failed', {
        error: (error as Error).message,
        fileId: file.id,
      });
    }
  }
}
