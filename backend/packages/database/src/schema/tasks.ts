import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { companyStructure } from './company';

// Приоритеты задач
export const taskPriorityEnum = pgEnum('task_priority', [
  'low',      // Низкий
  'normal',   // Обычный
  'high',     // Высокий
  'urgent',   // Срочный
  'critical'  // Критический
]);

// Статусы задач
export const taskStatusEnum = pgEnum('task_status', [
  'draft',        // Черновик
  'assigned',     // Назначена
  'in_progress',  // В работе
  'on_review',    // На проверке
  'completed',    // Выполнена
  'cancelled',    // Отменена
  'rejected',     // Отклонена
  'overdue'       // Просрочена
]);

// Типы задач
export const taskTypeEnum = pgEnum('task_type', [
  'task',         // Обычная задача
  'bug',          // Баг
  'feature',      // Фича
  'meeting',      // Встреча
  'review'        // Ревью
]);

// Уровни видимости задач
export const confidentialityLevelEnum = pgEnum('confidentiality_level', [
  'public',           // Видна всем
  'internal'          // Только участникам
]);

// Основная таблица задач
export const tasks: any = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Базовая информация
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: taskTypeEnum('type').notNull(),
  priority: taskPriorityEnum('priority').notNull().default('normal'),
  status: taskStatusEnum('status').notNull().default('draft'),
  
  // Создатель и ответственные
  createdBy: uuid('created_by').notNull().references(() => users.id),
  assignedTo: uuid('assigned_to').references(() => users.id), // Основной исполнитель
  supervisorId: uuid('supervisor_id').references(() => users.id), // Руководитель проекта
  
  // Организационная принадлежность
  organizationId: uuid('organization_id').references(() => companyStructure.id),
  
  // Временные рамки
  startDate: timestamp('start_date'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  estimatedHours: integer('estimated_hours'), // Планируемое время (часы)
  actualHours: integer('actual_hours'),       // Фактическое время (часы)
  
  // Контроль и мониторинг
  isUrgent: boolean('is_urgent').default(false),
  requiresApproval: boolean('requires_approval').default(false),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  
  // Видимость
  confidentialityLevel: confidentialityLevelEnum('confidentiality_level').default('internal'),
  
  // Связи между задачами
  parentTaskId: uuid('parent_task_id').references(() => tasks.id), // Родительская задача
  dependsOnTaskIds: jsonb('depends_on_task_ids'), // JSON массив ID задач-зависимостей
  
  // Связанные документы
  relatedDocuments: jsonb('related_documents'),

  // Метаданные
  tags: jsonb('tags'),           // JSON массив тегов
  customFields: jsonb('custom_fields'), // Дополнительные поля
  
  // Результат выполнения
  result: text('result'),        // Описание результата
  completionPercentage: integer('completion_percentage').default(0), // Процент выполнения
  
  // Системные поля
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Назначения задач (множественные исполнители)
export const taskAssignments = pgTable('task_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Связи
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Роль в задаче
  role: varchar('role', { length: 50 }).notNull(), // executor, reviewer, approver, observer
  
  // Статус назначения
  status: varchar('assignment_status', { length: 50 }).notNull().default('assigned'), // assigned, accepted, declined, completed
  
  // Временные рамки для конкретного исполнителя
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at'),
  declinedAt: timestamp('declined_at'),
  completedAt: timestamp('completed_at'),
  
  // Комментарии и заметки
  assignmentNote: text('assignment_note'), // Комментарий при назначении
  declineReason: text('decline_reason'),   // Причина отклонения
  completionNote: text('completion_note'), // Комментарий при завершении
  
  // Оценка работы
  workQualityRating: integer('work_quality_rating'), // Оценка качества работы (1-5)
  timeliness: boolean('timeliness'),      // Своевременность выполнения
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Комментарии к задачам
export const taskComments = pgTable('task_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Связи
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => users.id),
  
  // Содержание
  content: text('content').notNull(),
  
  // Тип комментария
  type: varchar('comment_type', { length: 50 }).default('general'), // general, status_change, file_attachment, system
  
  // Связанные данные
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // assignment, file, user
  relatedEntityId: uuid('related_entity_id'),
  
  // Метаданные
  isInternal: boolean('is_internal').default(false), // Внутренний комментарий (только для исполнителей)
  editedAt: timestamp('edited_at'),
  isEdited: boolean('is_edited').default(false),
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// История изменений статуса задач
export const taskStatusHistory = pgTable('task_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Связи
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  
  // Изменения статуса
  fromStatus: taskStatusEnum('from_status'),
  toStatus: taskStatusEnum('to_status').notNull(),
  
  // Контекст изменения
  reason: text('reason'),
  automaticChange: boolean('automatic_change').default(false), // Автоматическое изменение (например, по дедлайну)
  
  // Временные данные
  changeDate: timestamp('change_date').notNull().defaultNow(),
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Файлы, связанные с задачами
export const taskFiles = pgTable('task_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Связи
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  fileId: uuid('file_id').notNull(), // Ссылка на файл в files таблице
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  
  // Контекст файла
  category: varchar('file_category', { length: 50 }).default('general'), // initial_docs, progress_report, final_result, supporting_materials
  description: text('description'),
  
  // Права доступа
  isPublic: boolean('is_public').default(false),
  accessLevel: varchar('access_level', { length: 50 }).default('task_participants'), // all, task_participants, supervisors_only
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Подзадачи и чек-листы
export const taskChecklist = pgTable('task_checklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Связи
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  
  // Содержание
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  
  // Статус и порядок
  isCompleted: boolean('is_completed').default(false),
  orderIndex: integer('order_index').default(0),
  
  // Ответственный за выполнение
  assignedTo: uuid('assigned_to').references(() => users.id),
  completedBy: uuid('completed_by').references(() => users.id),
  completedAt: timestamp('completed_at'),
  
  // Временные рамки
  dueDate: timestamp('due_date'),
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Настройки уведомлений для задач
export const taskNotificationSettings = pgTable('task_notification_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Связи
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Настройки уведомлений
  notifyOnAssignment: boolean('notify_on_assignment').default(true),
  notifyOnStatusChange: boolean('notify_on_status_change').default(true),
  notifyOnDueDateApproaching: boolean('notify_on_due_date_approaching').default(true),
  notifyOnComments: boolean('notify_on_comments').default(true),
  notifyOnOverdue: boolean('notify_on_overdue').default(true),
  
  // Каналы уведомлений
  emailNotifications: boolean('email_notifications').default(true),
  pushNotifications: boolean('push_notifications').default(true),
  smsNotifications: boolean('sms_notifications').default(false),
  
  // Время уведомлений
  reminderDaysBefore: integer('reminder_days_before').default(1), // За сколько дней напоминать о дедлайне
  quietHoursStart: varchar('quiet_hours_start', { length: 5 }).default('22:00'), // Начало тихих часов
  quietHoursEnd: varchar('quiet_hours_end', { length: 5 }).default('08:00'),     // Конец тихих часов
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;
export type TaskStatusHistory = typeof taskStatusHistory.$inferSelect;
export type InsertTaskStatusHistory = typeof taskStatusHistory.$inferInsert;
export type TaskFile = typeof taskFiles.$inferSelect;
export type InsertTaskFile = typeof taskFiles.$inferInsert;
export type TaskChecklist = typeof taskChecklist.$inferSelect;
export type InsertTaskChecklist = typeof taskChecklist.$inferInsert;
export type TaskNotificationSettings = typeof taskNotificationSettings.$inferSelect;
export type InsertTaskNotificationSettings = typeof taskNotificationSettings.$inferInsert;
