import { DatabaseConnection } from '@gov-platform/database';
import { File } from '@gov-platform/types';
import { config } from '../config';
import { logger } from '../utils/logger';

export class CacheService {
  private redis = DatabaseConnection.getInstance().getRedisClient();

  /**
   * Cache file information
   */
  async cacheFile(file: File): Promise<void> {
    try {
      const key = `${config.redis.cachePrefix}${file.id}`;
      await this.redis.setEx(key, config.redis.cacheTtl, JSON.stringify(file));
    } catch (error) {
      logger.error('Cache file failed', { error: (error as Error).message, fileId: file.id });
    }
  }

  /**
   * Get cached file
   */
  async getCachedFile(fileId: string): Promise<File | null> {
    try {
      const key = `${config.redis.cachePrefix}${fileId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) as File : null;
    } catch (error) {
      logger.error('Get cached file failed', { error: (error as Error).message, fileId });
      return null;
    }
  }

  /**
   * Remove cached file
   */
  async removeCachedFile(fileId: string): Promise<void> {
    try {
      const key = `${config.redis.cachePrefix}${fileId}`;
      await this.redis.del(key);
    } catch (error) {
      logger.error('Remove cached file failed', { error: (error as Error).message, fileId });
    }
  }

  /**
   * Cache file download URL
   */
  async cacheFileUrl(fileId: string, url: string, ttl: number = 3600): Promise<void> {
    try {
      const key = `${config.redis.cachePrefix}url:${fileId}`;
      await this.redis.setEx(key, ttl, url);
    } catch (error) {
      logger.error('Cache file URL failed', { error: (error as Error).message, fileId });
    }
  }

  /**
   * Get cached file URL
   */
  async getCachedFileUrl(fileId: string): Promise<string | null> {
    try {
      const key = `${config.redis.cachePrefix}url:${fileId}`;
      return await this.redis.get(key);
    } catch (error) {
      logger.error('Get cached file URL failed', { error: (error as Error).message, fileId });
      return null;
    }
  }

  /**
   * Cache file processing status
   */
  async cacheProcessingStatus(fileId: string, status: 'processing' | 'completed' | 'failed'): Promise<void> {
    try {
      const key = `${config.redis.cachePrefix}processing:${fileId}`;
      await this.redis.setEx(key, 3600, status);
    } catch (error) {
      logger.error('Cache processing status failed', { error: (error as Error).message, fileId, status });
    }
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(fileId: string): Promise<string | null> {
    try {
      const key = `${config.redis.cachePrefix}processing:${fileId}`;
      return await this.redis.get(key);
    } catch (error) {
      logger.error('Get processing status failed', { error: (error as Error).message, fileId });
      return null;
    }
  }

  /**
   * Cache user file count
   */
  async cacheUserFileCount(userId: string, count: number): Promise<void> {
    try {
      const key = `${config.redis.cachePrefix}usercount:${userId}`;
      await this.redis.setEx(key, 1800, count.toString()); // 30 minutes
    } catch (error) {
      logger.error('Cache user file count failed', { error: (error as Error).message, userId });
    }
  }

  /**
   * Get cached user file count
   */
  async getCachedUserFileCount(userId: string): Promise<number | null> {
    try {
      const key = `${config.redis.cachePrefix}usercount:${userId}`;
      const cached = await this.redis.get(key);
      return cached ? parseInt(cached, 10) : null;
    } catch (error) {
      logger.error('Get cached user file count failed', { error: (error as Error).message, userId });
      return null;
    }
  }
}
