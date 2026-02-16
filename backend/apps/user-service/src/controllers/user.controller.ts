import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ContactService } from '../services/contact.service';
import { logger } from '../utils/logger';
import {
  CreateUserRequest,
  UpdateUserRequest,
  AddContactRequest,
  PaginationSchema,
  ApiResponse,
  User,
  Contact,
  PaginatedResponse,
} from '@cube-demper/types';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

export class UserController {
  private userService = new UserService();
  private contactService = new ContactService();

  /**
   * Get current user profile
   */
  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const user = await this.userService.getUserById(req.user.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const response: ApiResponse<User> = {
        success: true,
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get profile failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile',
      });
    }
  };

  /**
   * Update user profile
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const updateData: UpdateUserRequest = req.body;
      const updatedUser = await this.userService.updateUser(req.user.userId, updateData);

      const response: ApiResponse<User> = {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Update profile failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to update profile',
      });
    }
  };

  /**
   * Get user by ID
   */
  getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await this.userService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Remove sensitive information for non-self requests
      if (req.user?.userId !== userId) {
        const { digitalCertificate, preferences, ...publicUser } = user;
        const response: ApiResponse<Partial<User>> = {
          success: true,
          data: publicUser,
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<User> = {
          success: true,
          data: user,
        };
        res.status(200).json(response);
      }
    } catch (error) {
      logger.error('Get user by ID failed', { error: (error as Error).message, targetUserId: req.params.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to get user',
      });
    }
  };

  /**
   * Search users
   */
  searchUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const pagination = PaginationSchema.parse(req.query);
      const results = await this.userService.searchUsers(
        query,
        pagination,
        req.user?.userId
      );

      // Remove sensitive information from search results
      const sanitizedResults = {
        ...results,
        data: results.data.map(user => {
          const { digitalCertificate, preferences, ...publicUser } = user;
          return publicUser;
        }),
      };

      const response: ApiResponse<PaginatedResponse<Partial<User>>> = {
        success: true,
        data: sanitizedResults,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Search users failed', { error: (error as Error).message, query: req.query.q });
      res.status(500).json({
        success: false,
        error: 'Search failed',
      });
    }
  };

  /**
   * Get all users (with pagination)
   */
  getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const pagination = PaginationSchema.parse(req.query);
      const results = await this.userService.getUsers(pagination);

      // Remove sensitive information
      const sanitizedResults = {
        ...results,
        data: results.data.map(user => {
          const { digitalCertificate, preferences, ...publicUser } = user;
          return publicUser;
        }),
      };

      const response: ApiResponse<PaginatedResponse<Partial<User>>> = {
        success: true,
        data: sanitizedResults,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get users failed', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: 'Failed to get users',
      });
    }
  };

  /**
   * Get user contacts
   */
  getContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const pagination = PaginationSchema.parse(req.query);
      const contacts = await this.userService.getUserContacts(req.user.userId, pagination);

      const response: ApiResponse<PaginatedResponse<User>> = {
        success: true,
        data: contacts,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get contacts failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to get contacts',
      });
    }
  };

  /**
   * Add contact
   */
  addContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const contactData: AddContactRequest = req.body;
      
      if (contactData.contactUserId === req.user.userId) {
        res.status(400).json({
          success: false,
          error: 'Cannot add yourself as contact',
        });
        return;
      }

      const contact = await this.contactService.addContact(req.user.userId, contactData);

      const response: ApiResponse<Contact> = {
        success: true,
        data: contact,
        message: 'Contact request sent successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Add contact failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to add contact',
      });
    }
  };

  /**
   * Accept contact request
   */
  acceptContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { contactId } = req.params;
      const contact = await this.contactService.acceptContactRequest(req.user.userId, contactId);

      const response: ApiResponse<Contact> = {
        success: true,
        data: contact,
        message: 'Contact request accepted',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Accept contact failed', { 
        error: (error as Error).message, 
        userId: req.user?.userId,
        contactId: req.params.contactId 
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to accept contact request',
      });
    }
  };

  /**
   * Decline contact request
   */
  declineContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { contactId } = req.params;
      await this.contactService.declineContactRequest(req.user.userId, contactId);

      const response: ApiResponse<never> = {
        success: true,
        message: 'Contact request declined',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Decline contact failed', { 
        error: (error as Error).message, 
        userId: req.user?.userId,
        contactId: req.params.contactId 
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to decline contact request',
      });
    }
  };

  /**
   * Remove contact
   */
  removeContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { contactUserId } = req.params;
      await this.contactService.removeContact(req.user.userId, contactUserId);

      const response: ApiResponse<never> = {
        success: true,
        message: 'Contact removed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Remove contact failed', { 
        error: (error as Error).message, 
        userId: req.user?.userId,
        contactUserId: req.params.contactUserId 
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to remove contact',
      });
    }
  };

  /**
   * Block contact
   */
  blockContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { contactUserId } = req.params;
      const contact = await this.contactService.blockContact(req.user.userId, contactUserId);

      const response: ApiResponse<Contact> = {
        success: true,
        data: contact,
        message: 'Contact blocked successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Block contact failed', { 
        error: (error as Error).message, 
        userId: req.user?.userId,
        contactUserId: req.params.contactUserId 
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message || 'Failed to block contact',
      });
    }
  };

  /**
   * Get pending contact requests
   */
  getPendingRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const pagination = PaginationSchema.parse(req.query);
      const requests = await this.contactService.getPendingRequests(req.user.userId, pagination);

      const response: ApiResponse<typeof requests> = {
        success: true,
        data: requests,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get pending requests failed', { error: (error as Error).message, userId: req.user?.userId });
      res.status(500).json({
        success: false,
        error: 'Failed to get pending requests',
      });
    }
  };

  /**
   * Get online users count
   */
  getOnlineCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const count = await this.userService.getOnlineUsersCount();

      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get online count failed', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: 'Failed to get online users count',
      });
    }
  };

  /**
   * Health check
   */
  health = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      message: 'User service is healthy',
      timestamp: new Date().toISOString(),
      service: 'user-service',
      version: '0.1.0',
    });
  };
}
