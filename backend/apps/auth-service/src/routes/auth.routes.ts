import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import {
  LoginRequestSchema,
  RefreshTokenRequestSchema,
} from '@cube-demper/types';

const router = Router();
const authController = new AuthController();

// Public routes
router.post(
  '/register',
  authController.register
);

router.post(
  '/login-email',
  authController.loginByEmail
);

router.post(
  '/login',
  ValidationMiddleware.validateBody(LoginRequestSchema),
  authController.login
);

router.post(
  '/refresh',
  ValidationMiddleware.validateBody(RefreshTokenRequestSchema),
  authController.refresh
);

router.get('/health', authController.health);

// Protected routes
router.post(
  '/logout',
  AuthMiddleware.authenticate,
  authController.logout
);

router.post(
  '/logout-all',
  AuthMiddleware.authenticate,
  authController.logoutAll
);

router.get(
  '/me',
  AuthMiddleware.authenticate,
  authController.getCurrentUser
);

export { router as authRoutes };
