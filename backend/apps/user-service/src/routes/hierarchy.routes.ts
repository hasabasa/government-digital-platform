import { Router } from 'express';
import { HierarchyController } from '../controllers/hierarchy.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import {
  CreateGovernmentStructureRequestSchema,
  UpdateGovernmentStructureRequestSchema,
  CreatePositionRequestSchema,
  UpdatePositionRequestSchema,
  CreateAppointmentRequestSchema,
  PaginationSchema,
} from '@gov-platform/types';
import { z } from 'zod';

const router = Router();
const hierarchyController = new HierarchyController();

// Validation schemas for parameters
const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

const UserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

const AppointmentIdParamSchema = z.object({
  appointmentId: z.string().uuid(),
});

const OrganizationIdParamSchema = z.object({
  organizationId: z.string().uuid(),
});

// Query schemas
const GovernmentStructureQuerySchema = z.object({
  level: z.string().optional(),
  type: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

const GovernmentStructureTreeQuerySchema = z.object({
  rootId: z.string().uuid().optional(),
  maxDepth: z.string().regex(/^\d+$/).optional(),
});

const PositionsQuerySchema = PaginationSchema.extend({
  organizationId: z.string().uuid().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  isManagerial: z.enum(['true', 'false']).optional(),
});

const UserAppointmentsQuerySchema = z.object({
  current: z.enum(['true', 'false']).optional(),
});

const SubordinatesQuerySchema = z.object({
  direct: z.enum(['true', 'false']).optional(),
  includeIndirect: z.enum(['true', 'false']).optional(),
});

const OrganizationEmployeesQuerySchema = PaginationSchema.extend({
  includeSuborganizations: z.enum(['true', 'false']).optional(),
});

const DismissalBodySchema = z.object({
  dismissalReason: z.string().optional(),
  dismissalOrder: z.string().optional(),
});

const DeleteQuerySchema = z.object({
  force: z.enum(['true', 'false']).optional(),
});

// Public routes
router.get('/health', hierarchyController.health);

// Protected routes - require authentication
router.use(AuthMiddleware.authenticate);

// Government Structure endpoints
router.get(
  '/structure',
  ValidationMiddleware.validateQuery(GovernmentStructureQuerySchema),
  hierarchyController.getGovernmentStructure
);

router.get(
  '/structure/tree',
  ValidationMiddleware.validateQuery(GovernmentStructureTreeQuerySchema),
  hierarchyController.getGovernmentStructureTree
);

router.post(
  '/structure',
  ValidationMiddleware.validateBody(CreateGovernmentStructureRequestSchema),
  hierarchyController.createGovernmentStructure
);

router.put(
  '/structure/:id',
  ValidationMiddleware.validateParams(UuidParamSchema),
  ValidationMiddleware.validateBody(UpdateGovernmentStructureRequestSchema),
  hierarchyController.updateGovernmentStructure
);

router.delete(
  '/structure/:id',
  ValidationMiddleware.validateParams(UuidParamSchema),
  ValidationMiddleware.validateQuery(DeleteQuerySchema),
  hierarchyController.deleteGovernmentStructure
);

// Position endpoints
router.get(
  '/positions',
  ValidationMiddleware.validateQuery(PositionsQuerySchema),
  hierarchyController.getPositions
);

router.get(
  '/positions/:id',
  ValidationMiddleware.validateParams(UuidParamSchema),
  hierarchyController.getPositionById
);

router.post(
  '/positions',
  ValidationMiddleware.validateBody(CreatePositionRequestSchema),
  hierarchyController.createPosition
);

router.put(
  '/positions/:id',
  ValidationMiddleware.validateParams(UuidParamSchema),
  ValidationMiddleware.validateBody(UpdatePositionRequestSchema),
  hierarchyController.updatePosition
);

// Appointment endpoints
router.get(
  '/users/:userId/appointments',
  ValidationMiddleware.validateParams(UserIdParamSchema),
  ValidationMiddleware.validateQuery(UserAppointmentsQuerySchema),
  hierarchyController.getUserAppointments
);

router.post(
  '/appointments',
  ValidationMiddleware.validateBody(CreateAppointmentRequestSchema),
  hierarchyController.createAppointment
);

router.put(
  '/appointments/:appointmentId/dismiss',
  ValidationMiddleware.validateParams(AppointmentIdParamSchema),
  ValidationMiddleware.validateBody(DismissalBodySchema),
  hierarchyController.dismissFromPosition
);

// User hierarchy information endpoints
router.get(
  '/users/:userId/hierarchy',
  ValidationMiddleware.validateParams(UserIdParamSchema),
  hierarchyController.getUserHierarchyInfo
);

router.get(
  '/users/:userId/subordinates',
  ValidationMiddleware.validateParams(UserIdParamSchema),
  ValidationMiddleware.validateQuery(SubordinatesQuerySchema),
  hierarchyController.getUserSubordinates
);

// Organization employees endpoint
router.get(
  '/organizations/:organizationId/employees',
  ValidationMiddleware.validateParams(OrganizationIdParamSchema),
  ValidationMiddleware.validateQuery(OrganizationEmployeesQuerySchema),
  hierarchyController.getOrganizationEmployees
);

// Channel Management
router.post(
  '/organizations/:organizationId/create-channel',
  ValidationMiddleware.validateParams(z.object({
    organizationId: z.string().uuid(),
  })),
  hierarchyController.createOrganizationChannel
);

router.post(
  '/channels/:channelId/sync-membership/:organizationId',
  ValidationMiddleware.validateParams(z.object({
    channelId: z.string().uuid(),
    organizationId: z.string().uuid(),
  })),
  hierarchyController.syncChannelMembership
);

export { router as hierarchyRoutes };
