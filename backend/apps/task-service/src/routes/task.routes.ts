import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import {
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  AssignTaskRequestSchema,
  UpdateAssignmentRequestSchema,
  CreateCommentRequestSchema,
  CreateChecklistItemRequestSchema,
  UpdateChecklistItemRequestSchema,
  TaskFiltersSchema,
  PaginationSchema,
} from '@cube-demper/types';
import { z } from 'zod';

const router = Router();
const taskController = new TaskController();

// Parameter validation schemas
const TaskIdParamSchema = z.object({
  taskId: z.string().uuid(),
});

const AssignmentIdParamSchema = z.object({
  assignmentId: z.string().uuid(),
});

const ItemIdParamSchema = z.object({
  itemId: z.string().uuid(),
});

// Query schemas
const TaskQuerySchema = TaskFiltersSchema.merge(PaginationSchema);

const StatsQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  period: z.string().regex(/^\d+[dmy]$/).optional(),
});

// Public routes
router.get('/health', taskController.health);

// Protected routes - require authentication
router.use(AuthMiddleware.authenticate);

// Task management
router.get(
  '/',
  ValidationMiddleware.validateQuery(TaskQuerySchema),
  taskController.getTasks
);

router.get(
  '/:taskId',
  ValidationMiddleware.validateParams(TaskIdParamSchema),
  taskController.getTaskById
);

router.post(
  '/',
  ValidationMiddleware.validateBody(CreateTaskRequestSchema),
  taskController.createTask
);

router.put(
  '/:taskId',
  ValidationMiddleware.validateParams(TaskIdParamSchema),
  ValidationMiddleware.validateBody(UpdateTaskRequestSchema),
  taskController.updateTask
);

router.delete(
  '/:taskId',
  ValidationMiddleware.validateParams(TaskIdParamSchema),
  taskController.deleteTask
);

// Task assignments
router.post(
  '/:taskId/assignments',
  ValidationMiddleware.validateParams(TaskIdParamSchema),
  ValidationMiddleware.validateBody(AssignTaskRequestSchema),
  taskController.assignTask
);

router.put(
  '/assignments/:assignmentId',
  ValidationMiddleware.validateParams(AssignmentIdParamSchema),
  ValidationMiddleware.validateBody(UpdateAssignmentRequestSchema),
  taskController.updateAssignment
);

router.delete(
  '/assignments/:assignmentId',
  ValidationMiddleware.validateParams(AssignmentIdParamSchema),
  taskController.removeAssignment
);

// Comments
router.get(
  '/:taskId/comments',
  ValidationMiddleware.validateParams(TaskIdParamSchema),
  ValidationMiddleware.validateQuery(PaginationSchema),
  taskController.getTaskComments
);

router.post(
  '/:taskId/comments',
  ValidationMiddleware.validateParams(TaskIdParamSchema),
  ValidationMiddleware.validateBody(CreateCommentRequestSchema),
  taskController.createComment
);

// Checklist
router.get(
  '/:taskId/checklist',
  ValidationMiddleware.validateParams(TaskIdParamSchema),
  taskController.getTaskChecklist
);

router.post(
  '/:taskId/checklist',
  ValidationMiddleware.validateParams(TaskIdParamSchema),
  ValidationMiddleware.validateBody(CreateChecklistItemRequestSchema),
  taskController.createChecklistItem
);

router.put(
  '/checklist/:itemId',
  ValidationMiddleware.validateParams(ItemIdParamSchema),
  ValidationMiddleware.validateBody(UpdateChecklistItemRequestSchema),
  taskController.updateChecklistItem
);

router.delete(
  '/checklist/:itemId',
  ValidationMiddleware.validateParams(ItemIdParamSchema),
  taskController.deleteChecklistItem
);

// Statistics and reports
router.get(
  '/stats/overview',
  ValidationMiddleware.validateQuery(StatsQuerySchema),
  taskController.getTaskStats
);

router.get(
  '/:taskId/timeline',
  ValidationMiddleware.validateParams(TaskIdParamSchema),
  taskController.getTaskTimeline
);

// Assignable users
router.get(
  '/assignable-users',
  ValidationMiddleware.validateQuery(z.object({
    organizationId: z.string().uuid().optional(),
  })),
  taskController.getAssignableUsers
);

export { router as taskRoutes };
