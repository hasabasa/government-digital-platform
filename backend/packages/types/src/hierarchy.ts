import { z } from 'zod';
import { BaseEntitySchema } from './common';

// Enums для типов организаций
export const OrganizationTypeSchema = z.enum([
  'presidency',
  'parliament',
  'government',
  'ministry',
  'committee',
  'agency',
  'department',
  'division',
  'sector',
  'group',
  'regional_office',
  'local_administration'
]);

export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;

// Уровни иерархии
export const HierarchyLevelSchema = z.enum([
  'level_0', // Президент
  'level_1', // Министерства, Комитеты
  'level_2', // Департаменты
  'level_3', // Отделы
  'level_4', // Секторы
  'level_5', // Группы
  'level_6'  // Сотрудники
]);

export type HierarchyLevel = z.infer<typeof HierarchyLevelSchema>;

// Типы должностей
export const PositionTypeSchema = z.enum([
  'president',
  'prime_minister',
  'deputy_prime_minister',
  'minister',
  'deputy_minister',
  'chairman',
  'deputy_chairman',
  'head_of_department',
  'deputy_head_department',
  'head_of_division',
  'deputy_head_division',
  'head_of_sector',
  'leading_specialist',
  'chief_specialist',
  'senior_specialist',
  'specialist',
  'junior_specialist',
  'consultant',
  'advisor',
  'assistant'
]);

export type PositionType = z.infer<typeof PositionTypeSchema>;

// Категории госслужащих
export const CivilServiceCategorySchema = z.enum([
  'political',
  'administrative',
  'corps_a',
  'corps_b',
  'corps_c'
]);

export type CivilServiceCategory = z.infer<typeof CivilServiceCategorySchema>;

// Подкатегории
export const CivilServiceSubcategorySchema = z.enum([
  'corps_a1', 'corps_a2', 'corps_a3',
  'corps_b1', 'corps_b2', 'corps_b3', 'corps_b4', 'corps_b5',
  'corps_c1', 'corps_c2', 'corps_c3', 'corps_c4'
]);

export type CivilServiceSubcategory = z.infer<typeof CivilServiceSubcategorySchema>;

// Схема государственной структуры
export const GovernmentStructureSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(300),
  nameKk: z.string().max(300).optional(),
  nameEn: z.string().max(300).optional(),
  shortName: z.string().max(100).optional(),
  code: z.string().max(50).optional(),
  parentId: z.string().uuid().optional(),
  level: HierarchyLevelSchema,
  type: OrganizationTypeSchema,
  path: z.string().optional(),
  orderIndex: z.number().int().default(0),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  headUserId: z.string().uuid().optional(),
  deputyHeadUserId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  establishedDate: z.date().optional(),
});

export type GovernmentStructure = z.infer<typeof GovernmentStructureSchema>;

// Схема должности
export const PositionSchema = BaseEntitySchema.extend({
  title: z.string().min(1).max(300),
  titleKk: z.string().max(300).optional(),
  titleEn: z.string().max(300).optional(),
  code: z.string().max(50).optional(),
  organizationId: z.string().uuid(),
  type: PositionTypeSchema,
  category: CivilServiceCategorySchema,
  subcategory: CivilServiceSubcategorySchema.optional(),
  rank: z.number().int().optional(),
  reportsToPositionId: z.string().uuid().optional(),
  isManagerial: z.boolean().default(false),
  canManageSubordinates: z.boolean().default(false),
  canAssignTasks: z.boolean().default(false),
  canIssueDisciplinaryActions: z.boolean().default(false),
  description: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  minExperience: z.number().int().optional(),
  salaryGrade: z.number().int().optional(),
  maxPositions: z.number().int().default(1),
  isUnique: z.boolean().default(false),
  isActive: z.boolean().default(true),
  establishedDate: z.date().optional(),
  abolishedDate: z.date().optional(),
});

export type Position = z.infer<typeof PositionSchema>;

// Схема назначения
export const AppointmentSchema = BaseEntitySchema.extend({
  userId: z.string().uuid(),
  positionId: z.string().uuid(),
  organizationId: z.string().uuid(),
  appointmentDate: z.date(),
  dismissalDate: z.date().optional(),
  isCurrent: z.boolean().default(true),
  appointmentType: z.enum(['permanent', 'temporary', 'acting']),
  appointmentOrder: z.string().max(100).optional(),
  dismissalOrder: z.string().max(100).optional(),
  dismissalReason: z.string().max(200).optional(),
  salary: z.number().int().optional(),
  allowances: z.string().optional(), // JSON string
  workingConditions: z.string().optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

// Схема делегирования
export const DelegationSchema = BaseEntitySchema.extend({
  delegatorUserId: z.string().uuid(),
  delegateUserId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),
  permissions: z.string().optional(), // JSON string
  restrictions: z.string().optional(),
  reason: z.string().max(500).optional(),
});

export type Delegation = z.infer<typeof DelegationSchema>;

// Request/Response схемы для API

export const CreateGovernmentStructureRequestSchema = z.object({
  name: z.string().min(1).max(300),
  nameKk: z.string().max(300).optional(),
  nameEn: z.string().max(300).optional(),
  shortName: z.string().max(100).optional(),
  code: z.string().max(50).optional(),
  parentId: z.string().uuid().optional(),
  level: HierarchyLevelSchema,
  type: OrganizationTypeSchema,
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  headUserId: z.string().uuid().optional(),
  deputyHeadUserId: z.string().uuid().optional(),
});

export type CreateGovernmentStructureRequest = z.infer<typeof CreateGovernmentStructureRequestSchema>;

export const UpdateGovernmentStructureRequestSchema = CreateGovernmentStructureRequestSchema.partial();
export type UpdateGovernmentStructureRequest = z.infer<typeof UpdateGovernmentStructureRequestSchema>;

export const CreatePositionRequestSchema = z.object({
  title: z.string().min(1).max(300),
  titleKk: z.string().max(300).optional(),
  titleEn: z.string().max(300).optional(),
  code: z.string().max(50).optional(),
  organizationId: z.string().uuid(),
  type: PositionTypeSchema,
  category: CivilServiceCategorySchema,
  subcategory: CivilServiceSubcategorySchema.optional(),
  rank: z.number().int().optional(),
  reportsToPositionId: z.string().uuid().optional(),
  isManagerial: z.boolean().default(false),
  canManageSubordinates: z.boolean().default(false),
  canAssignTasks: z.boolean().default(false),
  canIssueDisciplinaryActions: z.boolean().default(false),
  description: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  minExperience: z.number().int().optional(),
  salaryGrade: z.number().int().optional(),
});

export type CreatePositionRequest = z.infer<typeof CreatePositionRequestSchema>;

export const UpdatePositionRequestSchema = CreatePositionRequestSchema.partial();
export type UpdatePositionRequest = z.infer<typeof UpdatePositionRequestSchema>;

export const CreateAppointmentRequestSchema = z.object({
  userId: z.string().uuid(),
  positionId: z.string().uuid(),
  organizationId: z.string().uuid(),
  appointmentDate: z.date(),
  appointmentType: z.enum(['permanent', 'temporary', 'acting']),
  appointmentOrder: z.string().max(100).optional(),
  salary: z.number().int().optional(),
  allowances: z.string().optional(),
  workingConditions: z.string().optional(),
});

export type CreateAppointmentRequest = z.infer<typeof CreateAppointmentRequestSchema>;

// Схемы для получения иерархической информации
export const HierarchyTreeNodeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: OrganizationTypeSchema,
  level: HierarchyLevelSchema,
  children: z.lazy(() => z.array(HierarchyTreeNodeSchema)).optional(),
  headUser: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().optional(),
  }).optional(),
  employeeCount: z.number().int(),
  isActive: z.boolean(),
});

export type HierarchyTreeNode = z.infer<typeof HierarchyTreeNodeSchema>;

export const UserHierarchyInfoSchema = z.object({
  currentPosition: PositionSchema.optional(),
  currentOrganization: GovernmentStructureSchema.optional(),
  directSupervisor: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string(),
  }).optional(),
  directSubordinates: z.array(z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string(),
  })),
  organizationPath: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: OrganizationTypeSchema,
  })),
  permissions: z.object({
    canManageSubordinates: z.boolean(),
    canAssignTasks: z.boolean(),
    canIssueDisciplinaryActions: z.boolean(),
    canCreateChannels: z.boolean(),
    canInitiateGroupCalls: z.boolean(),
  }),
});

export type UserHierarchyInfo = z.infer<typeof UserHierarchyInfoSchema>;
