import { DatabaseConnection } from '@gov-platform/database';
import { contacts, users } from '@gov-platform/database/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import {
  Contact,
  AddContactRequest,
  User,
  PaginatedResponse,
  Pagination,
} from '@gov-platform/types';
import { logger } from '../utils/logger';
import { CacheService } from './cache.service';
import { v4 as uuidv4 } from 'uuid';

export class ContactService {
  private db = DatabaseConnection.getInstance().getDb();
  private cacheService = new CacheService();

  /**
   * Add contact request
   */
  async addContact(userId: string, contactData: AddContactRequest): Promise<Contact> {
    try {
      // Check if contact already exists
      const existingContact = await this.getContactRelation(userId, contactData.contactUserId);
      if (existingContact) {
        if (existingContact.status === 'blocked') {
          throw new Error('Cannot add blocked contact');
        }
        if (existingContact.status === 'pending') {
          throw new Error('Contact request already sent');
        }
        if (existingContact.status === 'accepted') {
          throw new Error('Contact already exists');
        }
      }

      // Check if target user exists
      const [targetUser] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, contactData.contactUserId))
        .limit(1);

      if (!targetUser) {
        throw new Error('Target user not found');
      }

      if (targetUser.status !== 'active') {
        throw new Error('Cannot add inactive user as contact');
      }

      // Create contact request
      const newContact = {
        id: uuidv4(),
        userId,
        contactUserId: contactData.contactUserId,
        status: 'pending' as const,
        note: contactData.note,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [createdContact] = await this.db
        .insert(contacts)
        .values(newContact)
        .returning();

      // Invalidate caches
      await this.cacheService.invalidateUserCaches(userId);
      await this.cacheService.invalidateUserCaches(contactData.contactUserId);

      logger.info('Contact request sent', {
        userId,
        contactUserId: contactData.contactUserId,
        contactId: createdContact.id,
      });

      return createdContact;
    } catch (error) {
      logger.error('Add contact failed', { error: (error as Error).message, userId, contactData });
      throw error;
    }
  }

  /**
   * Accept contact request
   */
  async acceptContactRequest(userId: string, contactId: string): Promise<Contact> {
    try {
      // Find pending contact request
      const [contact] = await this.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, contactId),
            eq(contacts.contactUserId, userId),
            eq(contacts.status, 'pending')
          )
        )
        .limit(1);

      if (!contact) {
        throw new Error('Contact request not found or already processed');
      }

      // Accept the request
      const [updatedContact] = await this.db
        .update(contacts)
        .set({
          status: 'accepted',
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, contactId))
        .returning();

      // Create reverse contact relationship
      await this.db.insert(contacts).values({
        id: uuidv4(),
        userId,
        contactUserId: contact.userId,
        status: 'accepted',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Invalidate caches
      await this.cacheService.invalidateUserCaches(userId);
      await this.cacheService.invalidateUserCaches(contact.userId);

      logger.info('Contact request accepted', {
        userId,
        contactId,
        requesterId: contact.userId,
      });

      return updatedContact;
    } catch (error) {
      logger.error('Accept contact request failed', { error: (error as Error).message, userId, contactId });
      throw error;
    }
  }

  /**
   * Decline contact request
   */
  async declineContactRequest(userId: string, contactId: string): Promise<void> {
    try {
      const [contact] = await this.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, contactId),
            eq(contacts.contactUserId, userId),
            eq(contacts.status, 'pending')
          )
        )
        .limit(1);

      if (!contact) {
        throw new Error('Contact request not found or already processed');
      }

      // Delete the request
      await this.db
        .delete(contacts)
        .where(eq(contacts.id, contactId));

      logger.info('Contact request declined', {
        userId,
        contactId,
        requesterId: contact.userId,
      });
    } catch (error) {
      logger.error('Decline contact request failed', { error: (error as Error).message, userId, contactId });
      throw error;
    }
  }

  /**
   * Remove contact
   */
  async removeContact(userId: string, contactUserId: string): Promise<void> {
    try {
      // Remove both directions of the contact relationship
      await this.db
        .delete(contacts)
        .where(
          or(
            and(
              eq(contacts.userId, userId),
              eq(contacts.contactUserId, contactUserId)
            ),
            and(
              eq(contacts.userId, contactUserId),
              eq(contacts.contactUserId, userId)
            )
          )
        );

      // Invalidate caches
      await this.cacheService.invalidateUserCaches(userId);
      await this.cacheService.invalidateUserCaches(contactUserId);

      logger.info('Contact removed', { userId, contactUserId });
    } catch (error) {
      logger.error('Remove contact failed', { error: (error as Error).message, userId, contactUserId });
      throw error;
    }
  }

  /**
   * Block contact
   */
  async blockContact(userId: string, contactUserId: string): Promise<Contact> {
    try {
      // Check if contact relationship exists
      let contact = await this.getContactRelation(userId, contactUserId);

      if (contact) {
        // Update existing contact to blocked
        const [updatedContact] = await this.db
          .update(contacts)
          .set({
            status: 'blocked',
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, contact.id))
          .returning();

        contact = updatedContact;
      } else {
        // Create new blocked contact
        const newContact = {
          id: uuidv4(),
          userId,
          contactUserId,
          status: 'blocked' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const [createdContact] = await this.db
          .insert(contacts)
          .values(newContact)
          .returning();

        contact = createdContact;
      }

      // Remove reverse contact if exists
      await this.db
        .delete(contacts)
        .where(
          and(
            eq(contacts.userId, contactUserId),
            eq(contacts.contactUserId, userId)
          )
        );

      // Invalidate caches
      await this.cacheService.invalidateUserCaches(userId);
      await this.cacheService.invalidateUserCaches(contactUserId);

      logger.info('Contact blocked', { userId, contactUserId, contactId: contact.id });

      return contact;
    } catch (error) {
      logger.error('Block contact failed', { error: (error as Error).message, userId, contactUserId });
      throw error;
    }
  }

  /**
   * Unblock contact
   */
  async unblockContact(userId: string, contactUserId: string): Promise<void> {
    try {
      await this.db
        .delete(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.contactUserId, contactUserId),
            eq(contacts.status, 'blocked')
          )
        );

      logger.info('Contact unblocked', { userId, contactUserId });
    } catch (error) {
      logger.error('Unblock contact failed', { error: (error as Error).message, userId, contactUserId });
      throw error;
    }
  }

  /**
   * Get pending contact requests
   */
  async getPendingRequests(
    userId: string,
    pagination: Pagination
  ): Promise<PaginatedResponse<Contact & { user: User }>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const requestsQuery = this.db
        .select({
          contact: contacts,
          user: users,
        })
        .from(contacts)
        .innerJoin(users, eq(contacts.userId, users.id))
        .where(
          and(
            eq(contacts.contactUserId, userId),
            eq(contacts.status, 'pending')
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(contacts.createdAt);

      const countQuery = this.db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(
          and(
            eq(contacts.contactUserId, userId),
            eq(contacts.status, 'pending')
          )
        );

      const [requestsResult, countResult] = await Promise.all([
        requestsQuery,
        countQuery
      ]);

      const requests = requestsResult.map(result => ({
        ...result.contact,
        user: result.user,
      }));

      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: requests,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Get pending requests failed', { error: (error as Error).message, userId, pagination });
      throw error;
    }
  }

  /**
   * Get contact relation between two users
   */
  private async getContactRelation(userId: string, contactUserId: string): Promise<Contact | null> {
    try {
      const [contact] = await this.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.contactUserId, contactUserId)
          )
        )
        .limit(1);

      return contact || null;
    } catch (error) {
      logger.error('Get contact relation failed', { error: (error as Error).message, userId, contactUserId });
      return null;
    }
  }

  /**
   * Check if users are contacts
   */
  async areContacts(userId: string, contactUserId: string): Promise<boolean> {
    try {
      const contact = await this.getContactRelation(userId, contactUserId);
      return contact?.status === 'accepted';
    } catch (error) {
      logger.error('Check are contacts failed', { error: (error as Error).message, userId, contactUserId });
      return false;
    }
  }

  /**
   * Get contact status between users
   */
  async getContactStatus(userId: string, contactUserId: string): Promise<string | null> {
    try {
      const contact = await this.getContactRelation(userId, contactUserId);
      return contact?.status || null;
    } catch (error) {
      logger.error('Get contact status failed', { error: (error as Error).message, userId, contactUserId });
      return null;
    }
  }
}
