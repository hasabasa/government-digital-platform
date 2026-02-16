import { DatabaseConnection } from '@cube-demper/database';
import { User } from '@cube-demper/types';
import { config } from '../config';
import { logger } from '../utils/logger';

export class CacheService {
  private redis = DatabaseConnection.getInstance().getRedisClient();

  /**
   * Get user from cache
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const cached = await this.redis.get(`${config.redis.cachePrefix}${userId}`);
      if (cached) {
        return JSON.parse(cached) as User;
      }
      return null;
    } catch (error) {
      logger.error('Cache get user failed', { error: (error as Error).message, userId });
      return null;
    }
  }

  /**
   * Set user in cache
   */
  async setUser(user: User): Promise<void> {
    try {
      await this.redis.setEx(
        `${config.redis.cachePrefix}${user.id}`,
        config.redis.cacheTtl,
        JSON.stringify(user)
      );
    } catch (error) {
      logger.error('Cache set user failed', { error: (error as Error).message, userId: user.id });
    }
  }

  /**
   * Delete user from cache
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.redis.del(`${config.redis.cachePrefix}${userId}`);
    } catch (error) {
      logger.error('Cache delete user failed', { error: (error as Error).message, userId });
    }
  }

  /**
   * Get multiple users from cache
   */
  async getUsers(userIds: string[]): Promise<(User | null)[]> {
    try {
      if (userIds.length === 0) return [];

      const keys = userIds.map(id => `${config.redis.cachePrefix}${id}`);
      const cached = await this.redis.mGet(keys);
      
      return cached.map(item => item ? JSON.parse(item) as User : null);
    } catch (error) {
      logger.error('Cache get users failed', { error: (error as Error).message, userIds });
      return new Array(userIds.length).fill(null);
    }
  }

  /**
   * Set multiple users in cache
   */
  async setUsers(users: User[]): Promise<void> {
    try {
      if (users.length === 0) return;

      const pipeline = this.redis.multi();
      
      for (const user of users) {
        pipeline.setEx(
          `${config.redis.cachePrefix}${user.id}`,
          config.redis.cacheTtl,
          JSON.stringify(user)
        );
      }
      
      await pipeline.exec();
    } catch (error) {
      logger.error('Cache set users failed', { error: (error as Error).message, userCount: users.length });
    }
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(query: string, results: any, ttl: number = 300): Promise<void> {
    try {
      const key = `search:${Buffer.from(query).toString('base64')}`;
      await this.redis.setEx(key, ttl, JSON.stringify(results));
    } catch (error) {
      logger.error('Cache search results failed', { error: (error as Error).message, query });
    }
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(query: string): Promise<any | null> {
    try {
      const key = `search:${Buffer.from(query).toString('base64')}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Get cached search results failed', { error: (error as Error).message, query });
      return null;
    }
  }

  /**
   * Cache user contacts
   */
  async cacheUserContacts(userId: string, contacts: User[]): Promise<void> {
    try {
      const key = `contacts:${userId}`;
      await this.redis.setEx(key, config.redis.cacheTtl, JSON.stringify(contacts));
    } catch (error) {
      logger.error('Cache user contacts failed', { error: (error as Error).message, userId });
    }
  }

  /**
   * Get cached user contacts
   */
  async getCachedUserContacts(userId: string): Promise<User[] | null> {
    try {
      const key = `contacts:${userId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) as User[] : null;
    } catch (error) {
      logger.error('Get cached user contacts failed', { error: (error as Error).message, userId });
      return null;
    }
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCaches(userId: string): Promise<void> {
    try {
      const keys = [
        `${config.redis.cachePrefix}${userId}`,
        `contacts:${userId}`,
      ];
      
      await this.redis.del(keys);
    } catch (error) {
      logger.error('Invalidate user caches failed', { error: (error as Error).message, userId });
    }
  }

  /**
   * Get online users from cache
   */
  async getOnlineUsers(): Promise<string[]> {
    try {
      const members = await this.redis.sMembers('online_users');
      return members;
    } catch (error) {
      logger.error('Get online users failed', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * Add user to online set
   */
  async addOnlineUser(userId: string): Promise<void> {
    try {
      await this.redis.sAdd('online_users', userId);
      await this.redis.expire('online_users', 3600); // 1 hour TTL
    } catch (error) {
      logger.error('Add online user failed', { error: (error as Error).message, userId });
    }
  }

  /**
   * Remove user from online set
   */
  async removeOnlineUser(userId: string): Promise<void> {
    try {
      await this.redis.sRem('online_users', userId);
    } catch (error) {
      logger.error('Remove online user failed', { error: (error as Error).message, userId });
    }
  }
}
