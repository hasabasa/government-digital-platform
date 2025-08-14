import { DatabaseConnection } from '@gov-platform/database';
import { users, contacts } from '@gov-platform/database/schema';
import { eq, and, or, ilike, not, sql } from 'drizzle-orm';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  PaginatedResponse,
  Pagination,
} from '@gov-platform/types';
import { logger } from '../utils/logger';
import { CacheService } from './cache.service';
import { SearchService } from './search.service';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  private db = DatabaseConnection.getInstance().getDb();
  private cacheService = new CacheService();
  private searchService = new SearchService();

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      // Try cache first
      const cached = await this.cacheService.getUser(userId);
      if (cached) {
        return cached;
      }

      // Query database
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user) {
        // Cache the result
        await this.cacheService.setUser(user);
      }

      return user || null;
    } catch (error) {
      logger.error('Get user by ID failed', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user) {
        await this.cacheService.setUser(user);
      }

      return user || null;
    } catch (error) {
      logger.error('Get user by email failed', { error: (error as Error).message, email });
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const newUser = {
        id: uuidv4(),
        ...userData,
        status: 'pending' as const,
        role: 'user' as const,
        isOnline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [createdUser] = await this.db
        .insert(users)
        .values(newUser)
        .returning();

      // Index in search
      await this.searchService.indexUser(createdUser);

      // Cache the new user
      await this.cacheService.setUser(createdUser);

      logger.info('User created successfully', { 
        userId: createdUser.id, 
        email: createdUser.email 
      });

      return createdUser;
    } catch (error) {
      logger.error('Create user failed', { error: (error as Error).message, userData });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updateData: UpdateUserRequest): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const updatedData = {
        ...updateData,
        updatedAt: new Date(),
      };

      const [updatedUser] = await this.db
        .update(users)
        .set(updatedData)
        .where(eq(users.id, userId))
        .returning();

      // Update cache
      await this.cacheService.setUser(updatedUser);

      // Update search index
      await this.searchService.indexUser(updatedUser);

      logger.info('User updated successfully', { userId, updatedFields: Object.keys(updateData) });

      return updatedUser;
    } catch (error) {
      logger.error('Update user failed', { error: (error as Error).message, userId, updateData });
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({
          status: 'inactive',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Remove from cache
      await this.cacheService.deleteUser(userId);

      // Remove from search index
      await this.searchService.deleteUser(userId);

      logger.info('User deleted successfully', { userId });
    } catch (error) {
      logger.error('Delete user failed', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(
    query: string,
    pagination: Pagination,
    currentUserId?: string
  ): Promise<PaginatedResponse<User>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Use Elasticsearch for advanced search
      const searchResults = await this.searchService.searchUsers(query, { page, limit });
      
      if (searchResults.data.length > 0) {
        return searchResults;
      }

      // Fallback to database search
      const whereCondition = and(
        or(
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.email, `%${query}%`),
          ilike(users.position, `%${query}%`),
          ilike(users.department, `%${query}%`),
          ilike(users.organization, `%${query}%`)
        ),
        eq(users.status, 'active'),
        currentUserId ? not(eq(users.id, currentUserId)) : undefined
      );

      const [usersResult, countResult] = await Promise.all([
        this.db
          .select()
          .from(users)
          .where(whereCondition)
          .limit(limit)
          .offset(offset)
          .orderBy(users.firstName, users.lastName),
        this.db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(whereCondition)
      ]);

      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: usersResult,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Search users failed', { error: (error as Error).message, query, pagination });
      throw error;
    }
  }

  /**
   * Get user contacts
   */
  async getUserContacts(
    userId: string,
    pagination: Pagination
  ): Promise<PaginatedResponse<User>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Get contacts with user information
      const contactsQuery = this.db
        .select({
          user: users,
          contact: contacts,
        })
        .from(contacts)
        .innerJoin(users, eq(contacts.contactUserId, users.id))
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.status, 'accepted')
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(users.firstName, users.lastName);

      const countQuery = this.db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.status, 'accepted')
          )
        );

      const [contactsResult, countResult] = await Promise.all([
        contactsQuery,
        countQuery
      ]);

      const contactUsers = contactsResult.map(result => result.user);
      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: contactUsers,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Get user contacts failed', { error: (error as Error).message, userId, pagination });
      throw error;
    }
  }

  /**
   * Get users with pagination
   */
  async getUsers(pagination: Pagination): Promise<PaginatedResponse<User>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const [usersResult, countResult] = await Promise.all([
        this.db
          .select()
          .from(users)
          .where(eq(users.status, 'active'))
          .limit(limit)
          .offset(offset)
          .orderBy(users.createdAt),
        this.db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.status, 'active'))
      ]);

      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: usersResult,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Get users failed', { error: (error as Error).message, pagination });
      throw error;
    }
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({
          isOnline,
          lastLoginAt: isOnline ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Update cache
      const user = await this.getUserById(userId);
      if (user) {
        await this.cacheService.setUser({ ...user, isOnline });
      }

      logger.info('User online status updated', { userId, isOnline });
    } catch (error) {
      logger.error('Update online status failed', { error: (error as Error).message, userId, isOnline });
      throw error;
    }
  }

  /**
   * Get online users count
   */
  async getOnlineUsersCount(): Promise<number> {
    try {
      const [result] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            eq(users.isOnline, true),
            eq(users.status, 'active')
          )
        );

      return result?.count || 0;
    } catch (error) {
      logger.error('Get online users count failed', { error: (error as Error).message });
      throw error;
    }
  }
}
