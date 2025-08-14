import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { governmentStructure } from './hierarchy';

// Enums для дисциплинарных мер
export const disciplinaryActionTypeEnum = pgEnum('disciplinary_action_type', [
  'verbal_warning',      // Устное замечание
  'written_warning',     // Письменное замечание
  'reprimand',          // Выговор
  'severe_reprimand',   // Строгий выговор
  'demotion',           // Понижение в должности
  'salary_reduction',   // Снижение заработной платы
  'dismissal',          // Увольнение
  'suspension'          // Отстранение от должности
]);

export const commendationTypeEnum = pgEnum('commendation_type', [
  'verbal_praise',      // Устная благодарность
  'written_praise',     // Письменная благодарность
  'certificate',        // Грамота
  'bonus',             // Премия
  'promotion',         // Продвижение по службе
  'medal',             // Медаль/орден
  'recognition'        // Почетное звание
]);

export const disciplinaryStatusEnum = pgEnum('disciplinary_status', [
  'active',            // Активно
  'appealed',          // Обжаловано
  'overturned',        // Отменено
  'expired',           // Истекло
  'completed'          // Выполнено
]);

export const severityLevelEnum = pgEnum('severity_level', [
  'minor',             // Незначительное
  'moderate',          // Умеренное
  'serious',           // Серьезное
  'critical'           // Критическое
]);

// Таблица дисциплинарных взысканий
export const disciplinaryActions = pgTable('disciplinary_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Кого касается взыскание
  employeeId: uuid('employee_id').notNull().references(() => users.id),
  
  // Кто выносит взыскание
  issuedBy: uuid('issued_by').notNull().references(() => users.id),
  
  // Организация, где произошло нарушение
  organizationId: uuid('organization_id').references(() => governmentStructure.id),
  
  // Тип дисциплинарного взыскания
  actionType: disciplinaryActionTypeEnum('action_type').notNull(),
  
  // Статус взыскания
  status: disciplinaryStatusEnum('status').notNull().default('active'),
  
  // Уровень серьезности
  severityLevel: severityLevelEnum('severity_level').notNull().default('moderate'),
  
  // Основная информация
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  reason: text('reason').notNull(), // Причина взыскания
  
  // Нарушенные нормы/документы
  violatedRegulations: jsonb('violated_regulations').default([]),
  
  // Документы и доказательства
  evidenceDocuments: jsonb('evidence_documents').default([]),
  
  // Даты
  incidentDate: timestamp('incident_date').notNull(), // Дата нарушения
  issuedDate: timestamp('issued_date').notNull().defaultNow(), // Дата вынесения
  effectiveDate: timestamp('effective_date').notNull(), // Дата вступления в силу
  expiryDate: timestamp('expiry_date'), // Дата истечения (для временных мер)
  
  // Дополнительные условия
  conditions: text('conditions'), // Условия выполнения
  financialImpact: jsonb('financial_impact'), // Финансовые последствия
  
  // Процедурная информация
  appealDeadline: timestamp('appeal_deadline'), // Срок для обжалования
  reviewedBy: uuid('reviewed_by').references(() => users.id), // Кто рассматривал
  approvedBy: uuid('approved_by').references(() => users.id), // Кто утвердил
  
  // Связанные дела
  relatedCaseId: uuid('related_case_id'), // Связанное дело
  previousActionId: uuid('previous_action_id').references(() => disciplinaryActions.id), // Предыдущее взыскание
  
  // Исполнение
  isExecuted: boolean('is_executed').default(false),
  executionDate: timestamp('execution_date'),
  executionNotes: text('execution_notes'),
  
  // Метаданные
  isConfidential: boolean('is_confidential').default(false),
  requiresNotification: boolean('requires_notification').default(true),
  notificationSent: boolean('notification_sent').default(false),
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Таблица поощрений
export const commendations = pgTable('commendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Кого поощряют
  employeeId: uuid('employee_id').notNull().references(() => users.id),
  
  // Кто выносит поощрение
  issuedBy: uuid('issued_by').notNull().references(() => users.id),
  
  // Организация
  organizationId: uuid('organization_id').references(() => governmentStructure.id),
  
  // Тип поощрения
  commendationType: commendationTypeEnum('commendation_type').notNull(),
  
  // Основная информация
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  achievement: text('achievement').notNull(), // Описание достижения
  
  // Детали достижения
  performancePeriod: jsonb('performance_period'), // Период за который поощрение
  achievementMetrics: jsonb('achievement_metrics'), // Метрики достижения
  
  // Документы
  supportingDocuments: jsonb('supporting_documents').default([]),
  
  // Даты
  achievementDate: timestamp('achievement_date'), // Дата достижения
  issuedDate: timestamp('issued_date').notNull().defaultNow(),
  effectiveDate: timestamp('effective_date').notNull(),
  
  // Финансовые аспекты
  monetaryReward: jsonb('monetary_reward'), // Денежное вознаграждение
  nonMonetaryBenefits: jsonb('non_monetary_benefits'), // Нематериальные льготы
  
  // Процедурная информация
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  
  // Публичность
  isPublic: boolean('is_public').default(true), // Публично ли поощрение
  publishedDate: timestamp('published_date'),
  
  // Исполнение
  isExecuted: boolean('is_executed').default(false),
  executionDate: timestamp('execution_date'),
  executionNotes: text('execution_notes'),
  
  // Метаданные
  requiresNotification: boolean('requires_notification').default(true),
  notificationSent: boolean('notification_sent').default(false),
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Таблица обжалований дисциплинарных мер
export const disciplinaryAppeals = pgTable('disciplinary_appeals', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Ссылка на дисциплинарное взыскание
  disciplinaryActionId: uuid('disciplinary_action_id').notNull().references(() => disciplinaryActions.id),
  
  // Кто подает обжалование
  appealedBy: uuid('appealed_by').notNull().references(() => users.id),
  
  // Основания для обжалования
  grounds: text('grounds').notNull(),
  supportingEvidence: jsonb('supporting_evidence').default([]),
  
  // Статус обжалования
  status: pgEnum('appeal_status', ['pending', 'under_review', 'approved', 'rejected', 'withdrawn'])('status').notNull().default('pending'),
  
  // Рассмотрение
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewDate: timestamp('review_date'),
  reviewNotes: text('review_notes'),
  decision: text('decision'),
  
  // Даты
  submittedDate: timestamp('submitted_date').notNull().defaultNow(),
  deadlineDate: timestamp('deadline_date').notNull(),
  decidedDate: timestamp('decided_date'),
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Таблица истории изменений статусов
export const disciplinaryStatusHistory = pgTable('disciplinary_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Ссылка на дисциплинарное действие
  disciplinaryActionId: uuid('disciplinary_action_id').notNull().references(() => disciplinaryActions.id),
  
  // Изменение статуса
  fromStatus: disciplinaryStatusEnum('from_status'),
  toStatus: disciplinaryStatusEnum('to_status').notNull(),
  
  // Кто изменил и почему
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  reason: text('reason'),
  notes: text('notes'),
  
  // Дата изменения
  changeDate: timestamp('change_date').notNull().defaultNow(),
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Таблица уведомлений о дисциплинарных мерах
export const disciplinaryNotifications = pgTable('disciplinary_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Ссылка на действие
  disciplinaryActionId: uuid('disciplinary_action_id').references(() => disciplinaryActions.id),
  commendationId: uuid('commendation_id').references(() => commendations.id),
  
  // Получатель уведомления
  recipientId: uuid('recipient_id').notNull().references(() => users.id),
  
  // Тип уведомления
  notificationType: pgEnum('notification_type', [
    'action_issued',      // Взыскание вынесено
    'action_executed',    // Взыскание исполнено
    'appeal_deadline',    // Напоминание о сроке обжалования
    'status_changed',     // Изменение статуса
    'commendation_issued' // Поощрение вынесено
  ])('notification_type').notNull(),
  
  // Содержание уведомления
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  
  // Статус доставки
  isDelivered: boolean('is_delivered').default(false),
  deliveryDate: timestamp('delivery_date'),
  isRead: boolean('is_read').default(false),
  readDate: timestamp('read_date'),
  
  // Каналы уведомления
  channels: jsonb('channels').default(['system']), // system, email, sms, push
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Export types
export type DisciplinaryAction = typeof disciplinaryActions.$inferSelect;
export type InsertDisciplinaryAction = typeof disciplinaryActions.$inferInsert;

export type Commendation = typeof commendations.$inferSelect;
export type InsertCommendation = typeof commendations.$inferInsert;

export type DisciplinaryAppeal = typeof disciplinaryAppeals.$inferSelect;
export type InsertDisciplinaryAppeal = typeof disciplinaryAppeals.$inferInsert;

export type DisciplinaryStatusHistory = typeof disciplinaryStatusHistory.$inferSelect;
export type InsertDisciplinaryStatusHistory = typeof disciplinaryStatusHistory.$inferInsert;

export type DisciplinaryNotification = typeof disciplinaryNotifications.$inferSelect;
export type InsertDisciplinaryNotification = typeof disciplinaryNotifications.$inferInsert;
