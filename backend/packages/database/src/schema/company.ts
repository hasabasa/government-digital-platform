import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// Типы подразделений компании
export const organizationTypeEnum = pgEnum('organization_type', [
  'company',     // Компания (верхний уровень)
  'department',  // Департамент
  'team',        // Команда
  'unit'         // Подразделение
]);

// Уровни в иерархии (0 - самый высокий)
export const hierarchyLevelEnum = pgEnum('hierarchy_level', [
  'level_0', // Компания
  'level_1', // Департамент
  'level_2', // Команда
  'level_3'  // Подразделение
]);

// Организационная структура компании
export const companyStructure: any = pgTable('company_structure', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Базовая информация
  name: varchar('name', { length: 300 }).notNull(),

  // Иерархическая структура
  parentId: uuid('parent_id').references(() => companyStructure.id),
  level: hierarchyLevelEnum('level').notNull(),
  type: organizationTypeEnum('type').notNull(),
  path: text('path'), // Materialized path для быстрых запросов
  orderIndex: integer('order_index').default(0),

  // Описание и руководство
  description: text('description'),
  headUserId: uuid('head_user_id').references(() => users.id),

  // Статус
  isActive: boolean('is_active').default(true),

  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Типы должностей
export const positionTypeEnum = pgEnum('position_type', [
  'director',    // Директор
  'manager',     // Менеджер
  'team_lead',   // Тимлид
  'senior',      // Старший специалист
  'middle',      // Специалист
  'junior',      // Младший специалист
  'intern'       // Стажёр
]);

// Должности в компании
export const positions: any = pgTable('positions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Основная информация
  title: varchar('title', { length: 300 }).notNull(),

  // Принадлежность к структуре
  organizationId: uuid('organization_id').notNull().references(() => companyStructure.id),

  // Классификация
  type: positionTypeEnum('type').notNull(),

  // Иерархия
  reportsToPositionId: uuid('reports_to_position_id').references(() => positions.id),
  isManagerial: boolean('is_managerial').default(false),
  canManageSubordinates: boolean('can_manage_subordinates').default(false),
  canAssignTasks: boolean('can_assign_tasks').default(false),

  // Описание
  description: text('description'),

  // Статус
  isActive: boolean('is_active').default(true),

  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Назначения на должности
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Связи
  userId: uuid('user_id').notNull().references(() => users.id),
  positionId: uuid('position_id').notNull().references(() => positions.id),
  organizationId: uuid('organization_id').notNull().references(() => companyStructure.id),

  // Детали
  appointmentDate: timestamp('appointment_date').notNull(),
  dismissalDate: timestamp('dismissal_date'),
  isCurrent: boolean('is_current').default(true),
  appointmentType: varchar('appointment_type', { length: 50 }).notNull(), // permanent, temporary, acting
  dismissalReason: varchar('dismissal_reason', { length: 200 }),
  salary: integer('salary'),

  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Backward-compatible alias
export const governmentStructure = companyStructure;

export type CompanyStructure = typeof companyStructure.$inferSelect;
export type InsertCompanyStructure = typeof companyStructure.$inferInsert;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
