import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import {
  UpdateUserRequestSchema,
  AddContactRequestSchema,
  PaginationSchema,
} from '@cube-demper/types';
import { z } from 'zod';

const router = Router();
const userController = new UserController();

// Validation schemas for parameters
const UserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

const ContactIdParamSchema = z.object({
  contactId: z.string().uuid(),
});

const ContactUserIdParamSchema = z.object({
  contactUserId: z.string().uuid(),
});

// Public routes
router.get('/health', userController.health);
router.get('/online-count', userController.getOnlineCount);

// Protected routes - require authentication
router.use(AuthMiddleware.authenticate);

// Profile management
router.get(
  '/profile',
  userController.getProfile
);

router.put(
  '/profile',
  ValidationMiddleware.validateBody(UpdateUserRequestSchema),
  userController.updateProfile
);

// User operations
router.get(
  '/search',
  ValidationMiddleware.validateQuery(PaginationSchema.extend({
    q: z.string().min(1),
  })),
  userController.searchUsers
);

router.get(
  '/list',
  ValidationMiddleware.validateQuery(PaginationSchema),
  userController.getUsers
);

router.get(
  '/:userId',
  ValidationMiddleware.validateParams(UserIdParamSchema),
  userController.getUserById
);

// Contact management
router.get(
  '/contacts/list',
  ValidationMiddleware.validateQuery(PaginationSchema),
  userController.getContacts
);

router.get(
  '/contacts/pending',
  ValidationMiddleware.validateQuery(PaginationSchema),
  userController.getPendingRequests
);

router.post(
  '/contacts',
  ValidationMiddleware.validateBody(AddContactRequestSchema),
  userController.addContact
);

router.put(
  '/contacts/:contactId/accept',
  ValidationMiddleware.validateParams(ContactIdParamSchema),
  userController.acceptContact
);

router.delete(
  '/contacts/:contactId/decline',
  ValidationMiddleware.validateParams(ContactIdParamSchema),
  userController.declineContact
);

router.delete(
  '/contacts/:contactUserId',
  ValidationMiddleware.validateParams(ContactUserIdParamSchema),
  userController.removeContact
);

router.post(
  '/contacts/:contactUserId/block',
  ValidationMiddleware.validateParams(ContactUserIdParamSchema),
  userController.blockContact
);

export { router as userRoutes };
