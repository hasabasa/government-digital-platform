import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { File } from '@gov-platform/types';

export class StorageService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      forcePathStyle: config.s3.forcePathStyle,
    });
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    key: string,
    metadata?: Record<string, string>
  ): Promise<{ url: string; etag: string }> {
    try {
      const fileBuffer = file.buffer;
      let uploadBuffer = fileBuffer;

      // Encrypt file if encryption is enabled
      if (config.security.encryptionEnabled) {
        uploadBuffer = this.encryptBuffer(fileBuffer);
      }

      const command = new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: uploadBuffer,
        ContentType: file.mimetype,
        ContentLength: uploadBuffer.length,
        Metadata: {
          'original-name': encodeURIComponent(file.originalname),
          'upload-timestamp': new Date().toISOString(),
          'encrypted': config.security.encryptionEnabled.toString(),
          ...metadata,
        },
      });

      const result = await this.s3Client.send(command);
      const url = `${config.s3.endpoint}/${config.s3.bucket}/${key}`;

      logger.info('File uploaded to S3', {
        key,
        size: uploadBuffer.length,
        etag: result.ETag,
      });

      return {
        url,
        etag: result.ETag || '',
      };
    } catch (error) {
      logger.error('S3 upload failed', { error: (error as Error).message, key });
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * Download file from S3
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);
      const chunks: Buffer[] = [];

      if (result.Body) {
        const stream = result.Body as any;
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
      }

      let fileBuffer = Buffer.concat(chunks);

      // Decrypt file if it was encrypted
      const isEncrypted = result.Metadata?.encrypted === 'true';
      if (isEncrypted && config.security.encryptionEnabled) {
        fileBuffer = this.decryptBuffer(fileBuffer as any);
      }

      return fileBuffer;
    } catch (error) {
      logger.error('S3 download failed', { error: (error as Error).message, key });
      throw new Error(`Failed to download file: ${(error as Error).message}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info('File deleted from S3', { key });
    } catch (error) {
      logger.error('S3 delete failed', { error: (error as Error).message, key });
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string): Promise<any> {
    try {
      const command = new HeadObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);
      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        metadata: result.Metadata,
        etag: result.ETag,
      };
    } catch (error) {
      logger.error('Get S3 metadata failed', { error: (error as Error).message, key });
      throw new Error(`Failed to get file metadata: ${(error as Error).message}`);
    }
  }

  /**
   * Generate signed URL for file access
   */
  async generateSignedUrl(key: string, expiresIn: number = config.security.signedUrlExpiration): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      logger.error('Generate signed URL failed', { error: (error as Error).message, key });
      throw new Error(`Failed to generate signed URL: ${(error as Error).message}`);
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileMetadata(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate unique file key
   */
  generateFileKey(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `uploads/${userId}/${timestamp}-${randomStr}-${sanitizedName}.${extension}`;
  }

  /**
   * Generate thumbnail key
   */
  generateThumbnailKey(originalKey: string, size: string): string {
    const keyParts = originalKey.split('/');
    const fileName = keyParts.pop() || '';
    const directory = keyParts.join('/');
    
    return `${directory}/thumbnails/${size}_${fileName}`;
  }

  /**
   * Encrypt buffer
   */
  private encryptBuffer(buffer: Buffer): Buffer {
    const algorithm = config.security.encryptionAlgorithm;
    const key = crypto.scryptSync(process.env.FILE_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    
    // Prepend IV to encrypted data
    return Buffer.concat([iv, encrypted]);
  }

  /**
   * Decrypt buffer
   */
  private decryptBuffer(buffer: Buffer): Buffer {
    const algorithm = config.security.encryptionAlgorithm;
    const key = crypto.scryptSync(process.env.FILE_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    
    // Extract IV from beginning of buffer
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);
    
    const decipher = crypto.createDecipher(algorithm, key);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    return decrypted;
  }

  /**
   * Calculate file checksum
   */
  calculateChecksum(buffer: Buffer): string {
    return crypto
      .createHash(config.security.checksumAlgorithm)
      .update(buffer)
      .digest('hex');
  }
}
