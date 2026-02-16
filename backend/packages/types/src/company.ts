import { z } from 'zod';
import { BaseEntitySchema } from './common';

// Типы подразделений компании
export const OrganizationTypeSchema = z.enum([
  'company',
  'department',
  'team',
  'unit'
]);

export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;

// Уровни иерархии
export const HierarchyLevelSchema = z.enum([
  'level_0', // Компания
  'level_1', // Департамент
  'level_2', // Команда
  'level_3'  // Подразделение
]);

export type HierarchyLevel = z.infer<typeof HierarchyLevelSchema>;

// Типы должностей
export const PositionTypeSchema = z.enum([
  'director',
  'manager',
  'team_lead',
  'senior',
  'middle',
  'junior',
  'intern'
]);

export type PositionType = z.infer<typeof PositionTypeSchema>;

// Структура компании
export const CompanyStructureSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(300),
  parentId: z.string().uuid().nullable().optional(),
  level: HierarchyLevelSchema,
  type: OrganizationTypeSchema,
  path: z.string().nullable().optional(),
  orderIndex: z.number().default(0),
  description: z.string().nullable().optional(),
  headUserId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type CompanyStructure = z.infer<typeof CompanyStructureSchema>;

// Должность
export const PositionSchema = BaseEntitySchema.extend({
  title: z.string().min(1).max(300),
  organizationId: z.string().uuid(),
  type: PositionTypeSchema,
  reportsToPositionId: z.string().uuid().nullable().optional(),
  isManagerial: z.boolean().default(false),
  canManageSubordinates: z.boolean().default(false),
  canAssignTasks: z.boolean().default(false),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type Position = z.infer<typeof PositionSchema>;

// Назначение
export const AppointmentSchema = BaseEntitySchema.extend({
  userId: z.string().uuid(),
  positionId: z.string().uuid(),
  organizationId: z.string().uuid(),
  appointmentDate: z.date(),
  dismissalDate: z.date().nullable().optional(),
  isCurrent: z.boolean().default(true),
  appointmentType: z.enum(['permanent', 'temporary', 'acting']),
  dismissalReason: z.string().nullable().optional(),
  salary: z.number().nullable().optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

// API запросы
export const CreateDepartmentRequestSchema = z.object({
  name: z.string().min(1).max(300),
  parentId: z.string().uuid().optional(),
  level: HierarchyLevelSchema,
  type: OrganizationTypeSchema,
  description: z.string().optional(),
  headUserId: z.string().uuid().optional(),
});

export type CreateDepartmentRequest = z.infer<typeof CreateDepartmentRequestSchema>;

export const UpdateDepartmentRequestSchema = CreateDepartmentRequestSchema.partial();
export type UpdateDepartmentRequest = z.infer<typeof UpdateDepartmentRequestSchema>;

// Backward compat
export const GovernmentStructureSchema = CompanyStructureSchema;
export type GovernmentStructure = CompanyStructure;
