import { z } from 'zod';
import { BaseEntitySchema } from './common';

// Enums для дисциплинарных мер
export const DisciplinaryActionTypeSchema = z.enum([
  'verbal_warning',
  'written_warning',
  'reprimand',
  'severe_reprimand',
  'demotion',
  'salary_reduction',
  'dismissal',
  'suspension'
]);

export type DisciplinaryActionType = z.infer<typeof DisciplinaryActionTypeSchema>;

export const CommendationTypeSchema = z.enum([
  'verbal_praise',
  'written_praise',
  'certificate',
  'bonus',
  'promotion',
  'medal',
  'recognition'
]);

export type CommendationType = z.infer<typeof CommendationTypeSchema>;

export const DisciplinaryStatusSchema = z.enum([
  'active',
  'appealed',
  'overturned',
  'expired',
  'completed'
]);

export type DisciplinaryStatus = z.infer<typeof DisciplinaryStatusSchema>;

export const SeverityLevelSchema = z.enum([
  'minor',
  'moderate',
  'serious',
  'critical'
]);

export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;

export const AppealStatusSchema = z.enum([
  'pending',
  'under_review',
  'approved',
  'rejected',
  'withdrawn'
]);

export type AppealStatus = z.infer<typeof AppealStatusSchema>;

export const NotificationTypeSchema = z.enum([
  'action_issued',
  'action_executed',
  'appeal_deadline',
  'status_changed',
  'commendation_issued'
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// Схемы для документов и доказательств
export const EvidenceDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  url: z.string().url(),
  uploadedAt: z.date(),
  uploadedBy: z.string().uuid(),
});

export type EvidenceDocument = z.infer<typeof EvidenceDocumentSchema>;

export const ViolatedRegulationSchema = z.object({
  regulation: z.string(),
  article: z.string().optional(),
  section: z.string().optional(),
  description: z.string(),
});

export type ViolatedRegulation = z.infer<typeof ViolatedRegulationSchema>;

export const FinancialImpactSchema = z.object({
  type: z.enum(['reduction', 'fine', 'deduction']),
  amount: z.number().positive(),
  currency: z.string().default('KZT'),
  duration: z.number().optional(), // В месяцах
  startDate: z.date(),
  endDate: z.date().optional(),
});

export type FinancialImpact = z.infer<typeof FinancialImpactSchema>;

export const MonetaryRewardSchema = z.object({
  type: z.enum(['bonus', 'salary_increase', 'one_time_payment']),
  amount: z.number().positive(),
  currency: z.string().default('KZT'),
  paymentDate: z.date(),
  taxable: z.boolean().default(true),
});

export type MonetaryReward = z.infer<typeof MonetaryRewardSchema>;

// Основная схема дисциплинарного взыскания
export const DisciplinaryActionSchema = BaseEntitySchema.extend({
  employeeId: z.string().uuid(),
  issuedBy: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  actionType: DisciplinaryActionTypeSchema,
  status: DisciplinaryStatusSchema.default('active'),
  severityLevel: SeverityLevelSchema.default('moderate'),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  reason: z.string().min(1),
  violatedRegulations: z.array(ViolatedRegulationSchema).optional(),
  evidenceDocuments: z.array(EvidenceDocumentSchema).optional(),
  incidentDate: z.date(),
  issuedDate: z.date(),
  effectiveDate: z.date(),
  expiryDate: z.date().optional(),
  conditions: z.string().optional(),
  financialImpact: FinancialImpactSchema.optional(),
  appealDeadline: z.date().optional(),
  reviewedBy: z.string().uuid().optional(),
  approvedBy: z.string().uuid().optional(),
  relatedCaseId: z.string().uuid().optional(),
  previousActionId: z.string().uuid().optional(),
  isExecuted: z.boolean().default(false),
  executionDate: z.date().optional(),
  executionNotes: z.string().optional(),
  isConfidential: z.boolean().default(false),
  requiresNotification: z.boolean().default(true),
  notificationSent: z.boolean().default(false),
});

export type DisciplinaryAction = z.infer<typeof DisciplinaryActionSchema>;

// Схема поощрения
export const CommendationSchema = BaseEntitySchema.extend({
  employeeId: z.string().uuid(),
  issuedBy: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  commendationType: CommendationTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  achievement: z.string().min(1),
  performancePeriod: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),
  achievementMetrics: z.record(z.any()).optional(),
  supportingDocuments: z.array(EvidenceDocumentSchema).optional(),
  achievementDate: z.date().optional(),
  issuedDate: z.date(),
  effectiveDate: z.date(),
  monetaryReward: MonetaryRewardSchema.optional(),
  nonMonetaryBenefits: z.array(z.string()).optional(),
  reviewedBy: z.string().uuid().optional(),
  approvedBy: z.string().uuid().optional(),
  isPublic: z.boolean().default(true),
  publishedDate: z.date().optional(),
  isExecuted: z.boolean().default(false),
  executionDate: z.date().optional(),
  executionNotes: z.string().optional(),
  requiresNotification: z.boolean().default(true),
  notificationSent: z.boolean().default(false),
});

export type Commendation = z.infer<typeof CommendationSchema>;

// Схема обжалования
export const DisciplinaryAppealSchema = BaseEntitySchema.extend({
  disciplinaryActionId: z.string().uuid(),
  appealedBy: z.string().uuid(),
  grounds: z.string().min(1),
  supportingEvidence: z.array(EvidenceDocumentSchema).optional(),
  status: AppealStatusSchema.default('pending'),
  reviewedBy: z.string().uuid().optional(),
  reviewDate: z.date().optional(),
  reviewNotes: z.string().optional(),
  decision: z.string().optional(),
  submittedDate: z.date(),
  deadlineDate: z.date(),
  decidedDate: z.date().optional(),
});

export type DisciplinaryAppeal = z.infer<typeof DisciplinaryAppealSchema>;

// Схемы запросов для API

export const CreateDisciplinaryActionRequestSchema = z.object({
  employeeId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  actionType: DisciplinaryActionTypeSchema,
  severityLevel: SeverityLevelSchema.default('moderate'),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  reason: z.string().min(1),
  violatedRegulations: z.array(ViolatedRegulationSchema).optional(),
  incidentDate: z.date(),
  effectiveDate: z.date(),
  expiryDate: z.date().optional(),
  conditions: z.string().optional(),
  financialImpact: FinancialImpactSchema.optional(),
  isConfidential: z.boolean().default(false),
  evidenceFiles: z.array(z.string().uuid()).optional(), // File IDs
});

export type CreateDisciplinaryActionRequest = z.infer<typeof CreateDisciplinaryActionRequestSchema>;

export const UpdateDisciplinaryActionRequestSchema = CreateDisciplinaryActionRequestSchema.partial().extend({
  status: DisciplinaryStatusSchema.optional(),
  executionNotes: z.string().optional(),
  isExecuted: z.boolean().optional(),
});

export type UpdateDisciplinaryActionRequest = z.infer<typeof UpdateDisciplinaryActionRequestSchema>;

export const CreateCommendationRequestSchema = z.object({
  employeeId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  commendationType: CommendationTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  achievement: z.string().min(1),
  performancePeriod: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),
  achievementMetrics: z.record(z.any()).optional(),
  achievementDate: z.date().optional(),
  effectiveDate: z.date(),
  monetaryReward: MonetaryRewardSchema.optional(),
  nonMonetaryBenefits: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
  supportingFiles: z.array(z.string().uuid()).optional(), // File IDs
});

export type CreateCommendationRequest = z.infer<typeof CreateCommendationRequestSchema>;

export const UpdateCommendationRequestSchema = CreateCommendationRequestSchema.partial().extend({
  executionNotes: z.string().optional(),
  isExecuted: z.boolean().optional(),
});

export type UpdateCommendationRequest = z.infer<typeof UpdateCommendationRequestSchema>;

export const CreateAppealRequestSchema = z.object({
  disciplinaryActionId: z.string().uuid(),
  grounds: z.string().min(1),
  supportingFiles: z.array(z.string().uuid()).optional(), // File IDs
});

export type CreateAppealRequest = z.infer<typeof CreateAppealRequestSchema>;

export const UpdateAppealRequestSchema = z.object({
  status: AppealStatusSchema.optional(),
  reviewNotes: z.string().optional(),
  decision: z.string().optional(),
});

export type UpdateAppealRequest = z.infer<typeof UpdateAppealRequestSchema>;

export const DisciplinaryFiltersSchema = z.object({
  employeeId: z.string().uuid().optional(),
  issuedBy: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  actionType: z.array(DisciplinaryActionTypeSchema).optional(),
  status: z.array(DisciplinaryStatusSchema).optional(),
  severityLevel: z.array(SeverityLevelSchema).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  isActive: z.boolean().optional(),
  isExecuted: z.boolean().optional(),
  search: z.string().optional(),
});

export type DisciplinaryFilters = z.infer<typeof DisciplinaryFiltersSchema>;

export const CommendationFiltersSchema = z.object({
  employeeId: z.string().uuid().optional(),
  issuedBy: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  commendationType: z.array(CommendationTypeSchema).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  isPublic: z.boolean().optional(),
  isExecuted: z.boolean().optional(),
  search: z.string().optional(),
});

export type CommendationFilters = z.infer<typeof CommendationFiltersSchema>;

// Расширенные схемы для ответов API

export const DisciplinaryActionWithDetailsSchema = DisciplinaryActionSchema.extend({
  employee: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    middleName: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
  }),
  issuer: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().optional(),
  }),
  reviewer: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().optional(),
  }).optional(),
  approver: z.object({
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
  appealInfo: z.object({
    appealId: z.string().uuid(),
    status: AppealStatusSchema,
    submittedDate: z.date(),
    deadlineDate: z.date(),
  }).optional(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canApprove: z.boolean(),
  canAppeal: z.boolean(),
  daysUntilExpiry: z.number().optional(),
});

export type DisciplinaryActionWithDetails = z.infer<typeof DisciplinaryActionWithDetailsSchema>;

export const CommendationWithDetailsSchema = CommendationSchema.extend({
  employee: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    middleName: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
  }),
  issuer: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().optional(),
  }),
  reviewer: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().optional(),
  }).optional(),
  approver: z.object({
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
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canApprove: z.boolean(),
});

export type CommendationWithDetails = z.infer<typeof CommendationWithDetailsSchema>;

export const DisciplinaryStatsSchema = z.object({
  totalActions: z.number().int(),
  activeActions: z.number().int(),
  totalCommendations: z.number().int(),
  totalAppeals: z.number().int(),
  pendingAppeals: z.number().int(),
  byActionType: z.record(DisciplinaryActionTypeSchema, z.number().int()),
  byCommendationType: z.record(CommendationTypeSchema, z.number().int()),
  bySeverity: z.record(SeverityLevelSchema, z.number().int()),
  byStatus: z.record(DisciplinaryStatusSchema, z.number().int()),
  monthlyTrends: z.array(z.object({
    month: z.string(),
    actions: z.number().int(),
    commendations: z.number().int(),
  })),
  topViolations: z.array(z.object({
    regulation: z.string(),
    count: z.number().int(),
  })),
});

export type DisciplinaryStats = z.infer<typeof DisciplinaryStatsSchema>;

export const EmployeeDisciplinaryRecordSchema = z.object({
  employeeId: z.string().uuid(),
  employee: z.object({
    firstName: z.string(),
    lastName: z.string(),
    middleName: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
  }),
  summary: z.object({
    totalActions: z.number().int(),
    activeActions: z.number().int(),
    totalCommendations: z.number().int(),
    lastActionDate: z.date().optional(),
    lastCommendationDate: z.date().optional(),
  }),
  recentActions: z.array(DisciplinaryActionSchema).max(5),
  recentCommendations: z.array(CommendationSchema).max(5),
  riskLevel: z.enum(['low', 'medium', 'high']),
});

export type EmployeeDisciplinaryRecord = z.infer<typeof EmployeeDisciplinaryRecordSchema>;
