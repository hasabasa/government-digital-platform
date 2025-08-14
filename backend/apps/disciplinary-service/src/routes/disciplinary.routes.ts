import { Router } from 'express';
import { DisciplinaryController } from '../controllers/disciplinary.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import {
  CreateDisciplinaryActionRequestSchema,
  UpdateDisciplinaryActionRequestSchema,
  CreateCommendationRequestSchema,
  UpdateCommendationRequestSchema,
  CreateAppealRequestSchema,
  DisciplinaryFiltersSchema,
  CommendationFiltersSchema,
  PaginationSchema,
} from '@gov-platform/types';
import { z } from 'zod';

const router = Router();
const disciplinaryController = new DisciplinaryController();

// Parameter validation schemas
const ActionIdParamSchema = z.object({
  actionId: z.string().uuid(),
});

const EmployeeIdParamSchema = z.object({
  employeeId: z.string().uuid(),
});

const CommendationIdParamSchema = z.object({
  commendationId: z.string().uuid(),
});

const AppealIdParamSchema = z.object({
  appealId: z.string().uuid(),
});

// Query schemas
const DisciplinaryQuerySchema = DisciplinaryFiltersSchema.merge(PaginationSchema);
const CommendationQuerySchema = CommendationFiltersSchema.merge(PaginationSchema);

const StatsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
});

// Public routes
router.get('/health', disciplinaryController.health);

// Protected routes - require authentication
router.use(AuthMiddleware.authenticate);

// User permissions endpoint
router.get('/permissions', disciplinaryController.getUserPermissions);

// Disciplinary Actions
router.get(
  '/actions',
  ValidationMiddleware.validateQuery(DisciplinaryQuerySchema),
  disciplinaryController.getDisciplinaryActions
);

router.get(
  '/actions/:actionId',
  ValidationMiddleware.validateParams(ActionIdParamSchema),
  disciplinaryController.getDisciplinaryActionById
);

router.post(
  '/actions',
  AuthMiddleware.requireManagerial,
  ValidationMiddleware.validateBody(CreateDisciplinaryActionRequestSchema),
  disciplinaryController.createDisciplinaryAction
);

router.put(
  '/actions/:actionId',
  ValidationMiddleware.validateParams(ActionIdParamSchema),
  ValidationMiddleware.validateBody(UpdateDisciplinaryActionRequestSchema),
  disciplinaryController.updateDisciplinaryAction
);

// Commendations
router.get(
  '/commendations',
  ValidationMiddleware.validateQuery(CommendationQuerySchema),
  disciplinaryController.getCommendations
);

router.post(
  '/commendations',
  AuthMiddleware.requireManagerial,
  ValidationMiddleware.validateBody(CreateCommendationRequestSchema),
  disciplinaryController.createCommendation
);

// Appeals
router.post(
  '/appeals',
  ValidationMiddleware.validateBody(CreateAppealRequestSchema),
  disciplinaryController.createAppeal
);

// Employee Records
router.get(
  '/employees/:employeeId/record',
  ValidationMiddleware.validateParams(EmployeeIdParamSchema),
  disciplinaryController.getEmployeeDisciplinaryRecord
);

// Statistics and Reports
router.get(
  '/stats',
  ValidationMiddleware.validateQuery(StatsQuerySchema),
  disciplinaryController.getDisciplinaryStats
);

// Templates
router.get(
  '/templates/actions',
  disciplinaryController.getActionTemplates
);

router.get(
  '/templates/commendations',
  disciplinaryController.getCommendationTemplates
);

export { router as disciplinaryRoutes };
