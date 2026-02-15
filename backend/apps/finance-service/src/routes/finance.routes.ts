import { Router } from 'express';
import { FinanceController } from '../controllers/finance.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { SalesInputSchema } from '../services/finance.service';

const router = Router();
const financeController = new FinanceController();

// Public routes
router.get('/health', financeController.health);
router.get('/tariffs', financeController.getTariffs);

// Protected routes
router.post(
    '/calculate',
    AuthMiddleware.authenticate,
    ValidationMiddleware.validateBody(SalesInputSchema),
    financeController.calculate
);

export { router as financeRoutes };
