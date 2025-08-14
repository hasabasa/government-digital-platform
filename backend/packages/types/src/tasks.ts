import { z } from 'zod';
import { BaseEntitySchema } from './common';

// Enums для задач
export const TaskPrioritySchema = z.enum([
  'low',
  'normal', 
  'high',
  'urgent',
  'critical'
]);

export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TaskStatusSchema = z.enum([
  'draft',
  'assigned',
  'in_progress',
  'on_review',
  'completed',
  'cancelled',
  'rejected',
  'overdue'
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskTypeSchema = z.enum([
  'directive',
  'assignment',
  'request',
  'project',
  'meeting',
  'report',
  'review',
  'approval',
  'monitoring'
]);

export type TaskType = z.infer<typeof TaskTypeSchema>;

export const ConfidentialityLevelSchema = z.enum([
  'public',
  'internal',
  'confidential',
  'secret',
  'top_secret'
]);

export type ConfidentialityLevel = z.infer<typeof ConfidentialityLevelSchema>;

export const AssignmentRoleSchema = z.enum([
  'executor',    // Исполнитель
  'reviewer',    // Проверяющий
  'approver',    // Утверждающий
  'observer'     // Наблюдатель
]);

export type AssignmentRole = z.infer<typeof AssignmentRoleSchema>;

export const AssignmentStatusSchema = z.enum([
  'assigned',
  'accepted',
  'declined',
  'completed'
]);

export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

export const CommentTypeSchema = z.enum([
  'general',
  'status_change',
  'file_attachment',
  'system'
]);

export type CommentType = z.infer<typeof CommentTypeSchema>;

export const FileCategorySchema = z.enum([
  'initial_docs',
  'progress_report',
  'final_result',
  'supporting_materials'
]);

export type FileCategory = z.infer<typeof FileCategorySchema>;

// Основная схема задачи
export const TaskSchema = BaseEntitySchema.extend({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: TaskTypeSchema,
  priority: TaskPrioritySchema.default('normal'),
  status: TaskStatusSchema.default('draft'),
  createdBy: z.string().uuid(),
  assignedTo: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  estimatedHours: z.number().int().positive().optional(),
  actualHours: z.number().int().positive().optional(),
  isUrgent: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.date().optional(),
  confidentialityLevel: ConfidentialityLevelSchema.default('internal'),
  accessRestrictions: z.string().optional(),
  parentTaskId: z.string().uuid().optional(),
  dependsOnTaskIds: z.array(z.string().uuid()).optional(),
  relatedDocuments: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    url: z.string().url(),
  })).optional(),
  orderNumber: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  result: z.string().optional(),
  completionPercentage: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export type Task = z.infer<typeof TaskSchema>;

// Схема назначения задачи
export const TaskAssignmentSchema = BaseEntitySchema.extend({
  taskId: z.string().uuid(),
  userId: z.string().uuid(),
  role: AssignmentRoleSchema,
  status: AssignmentStatusSchema.default('assigned'),
  assignedAt: z.date(),
  acceptedAt: z.date().optional(),
  declinedAt: z.date().optional(),
  completedAt: z.date().optional(),
  assignmentNote: z.string().optional(),
  declineReason: z.string().optional(),
  completionNote: z.string().optional(),
  workQualityRating: z.number().int().min(1).max(5).optional(),
  timeliness: z.boolean().optional(),
});

export type TaskAssignment = z.infer<typeof TaskAssignmentSchema>;

// Схема комментария к задаче
export const TaskCommentSchema = BaseEntitySchema.extend({
  taskId: z.string().uuid(),
  authorId: z.string().uuid(),
  content: z.string().min(1),
  type: CommentTypeSchema.default('general'),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().uuid().optional(),
  isInternal: z.boolean().default(false),
  editedAt: z.date().optional(),
  isEdited: z.boolean().default(false),
});

export type TaskComment = z.infer<typeof TaskCommentSchema>;

// Схема истории статусов
export const TaskStatusHistorySchema = BaseEntitySchema.extend({
  taskId: z.string().uuid(),
  changedBy: z.string().uuid(),
  fromStatus: TaskStatusSchema.optional(),
  toStatus: TaskStatusSchema,
  reason: z.string().optional(),
  automaticChange: z.boolean().default(false),
  changeDate: z.date(),
});

export type TaskStatusHistory = z.infer<typeof TaskStatusHistorySchema>;

// Схема файла задачи
export const TaskFileSchema = BaseEntitySchema.extend({
  taskId: z.string().uuid(),
  fileId: z.string().uuid(),
  uploadedBy: z.string().uuid(),
  category: FileCategorySchema.default('general'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(['all', 'task_participants', 'supervisors_only']).default('task_participants'),
});

export type TaskFile = z.infer<typeof TaskFileSchema>;

// Схема элемента чек-листа
export const TaskChecklistSchema = BaseEntitySchema.extend({
  taskId: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  isCompleted: z.boolean().default(false),
  orderIndex: z.number().int().default(0),
  assignedTo: z.string().uuid().optional(),
  completedBy: z.string().uuid().optional(),
  completedAt: z.date().optional(),
  dueDate: z.date().optional(),
});

export type TaskChecklist = z.infer<typeof TaskChecklistSchema>;

// Схемы запросов для API

export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: TaskTypeSchema,
  priority: TaskPrioritySchema.default('normal'),
  assignedTo: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().int().positive().optional(),
  isUrgent: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  confidentialityLevel: ConfidentialityLevelSchema.default('internal'),
  parentTaskId: z.string().uuid().optional(),
  dependsOnTaskIds: z.array(z.string().uuid()).optional(),
  orderNumber: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  assignments: z.array(z.object({
    userId: z.string().uuid(),
    role: AssignmentRoleSchema,
    note: z.string().optional(),
  })).optional(),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

export const UpdateTaskRequestSchema = CreateTaskRequestSchema.partial().extend({
  status: TaskStatusSchema.optional(),
  result: z.string().optional(),
  completionPercentage: z.number().int().min(0).max(100).optional(),
  actualHours: z.number().int().positive().optional(),
});

export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

export const AssignTaskRequestSchema = z.object({
  userId: z.string().uuid(),
  role: AssignmentRoleSchema,
  note: z.string().optional(),
});

export type AssignTaskRequest = z.infer<typeof AssignTaskRequestSchema>;

export const UpdateAssignmentRequestSchema = z.object({
  status: AssignmentStatusSchema.optional(),
  declineReason: z.string().optional(),
  completionNote: z.string().optional(),
  workQualityRating: z.number().int().min(1).max(5).optional(),
});

export type UpdateAssignmentRequest = z.infer<typeof UpdateAssignmentRequestSchema>;

export const CreateCommentRequestSchema = z.object({
  content: z.string().min(1),
  type: CommentTypeSchema.default('general'),
  isInternal: z.boolean().default(false),
});

export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

export const CreateChecklistItemRequestSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  orderIndex: z.number().int().default(0),
});

export type CreateChecklistItemRequest = z.infer<typeof CreateChecklistItemRequestSchema>;

export const UpdateChecklistItemRequestSchema = CreateChecklistItemRequestSchema.partial().extend({
  isCompleted: z.boolean().optional(),
});

export type UpdateChecklistItemRequest = z.infer<typeof UpdateChecklistItemRequestSchema>;

export const TaskFiltersSchema = z.object({
  status: z.array(TaskStatusSchema).optional(),
  priority: z.array(TaskPrioritySchema).optional(),
  type: z.array(TaskTypeSchema).optional(),
  assignedTo: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  dueDateFrom: z.date().optional(),
  dueDateTo: z.date().optional(),
  isOverdue: z.boolean().optional(),
  hasMyAssignments: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
});

export type TaskFilters = z.infer<typeof TaskFiltersSchema>;

// Расширенные схемы для ответов API

export const TaskWithDetailsSchema = TaskSchema.extend({
  creator: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().optional(),
  }),
  assignee: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().optional(),
  }).optional(),
  supervisor: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().optional(),
  }).optional(),
  organization: z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
  }).optional(),
  assignments: z.array(TaskAssignmentSchema.extend({
    user: z.object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      position: z.string().optional(),
    }),
  })),
  subtasks: z.array(TaskSchema).optional(),
  dependencies: z.array(TaskSchema).optional(),
  commentsCount: z.number().int(),
  filesCount: z.number().int(),
  checklistItemsCount: z.number().int(),
  completedChecklistItems: z.number().int(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canAssign: z.boolean(),
  canApprove: z.boolean(),
});

export type TaskWithDetails = z.infer<typeof TaskWithDetailsSchema>;

export const TaskStatsSchema = z.object({
  total: z.number().int(),
  byStatus: z.record(TaskStatusSchema, z.number().int()),
  byPriority: z.record(TaskPrioritySchema, z.number().int()),
  overdue: z.number().int(),
  dueSoon: z.number().int(), // В течение 3 дней
  assigned: z.number().int(),
  created: z.number().int(),
  supervised: z.number().int(),
});

export type TaskStats = z.infer<typeof TaskStatsSchema>;

export const TaskTimelineEventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['created', 'assigned', 'status_changed', 'commented', 'file_added', 'deadline_extended']),
  date: z.date(),
  actor: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type TaskTimelineEvent = z.infer<typeof TaskTimelineEventSchema>;

export const TaskNotificationSettingsSchema = z.object({
  userId: z.string().uuid(),
  notifyOnAssignment: z.boolean().default(true),
  notifyOnStatusChange: z.boolean().default(true),
  notifyOnDueDateApproaching: z.boolean().default(true),
  notifyOnComments: z.boolean().default(true),
  notifyOnOverdue: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  reminderDaysBefore: z.number().int().min(0).max(30).default(1),
  quietHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('22:00'),
  quietHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('08:00'),
});

export type TaskNotificationSettings = z.infer<typeof TaskNotificationSettingsSchema>;
