import { z } from 'zod';

// === Enum Schemas ===

export const TrafficChannelSchema = z.enum([
  'website', 'instagram', 'telegram', 'whatsapp', 'facebook',
  'referral', 'cold_call', 'exhibition', 'advertisement', 'partner', 'other',
]);
export type TrafficChannel = z.infer<typeof TrafficChannelSchema>;

export const FunnelStageSchema = z.enum([
  'new', 'contact', 'negotiation', 'proposal', 'deal',
]);
export type FunnelStage = z.infer<typeof FunnelStageSchema>;

export const LeadResultSchema = z.enum([
  'pending', 'won', 'lost', 'deferred',
]);
export type LeadResult = z.infer<typeof LeadResultSchema>;

export const SalesPlanPeriodSchema = z.enum(['monthly', 'quarterly']);
export type SalesPlanPeriod = z.infer<typeof SalesPlanPeriodSchema>;

// === Labels (русские) ===

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  new: 'Новый',
  contact: 'Контакт',
  negotiation: 'Переговоры',
  proposal: 'Предложение',
  deal: 'Сделка',
};

export const TRAFFIC_CHANNEL_LABELS: Record<TrafficChannel, string> = {
  website: 'Сайт',
  instagram: 'Instagram',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  referral: 'Реферал',
  cold_call: 'Холодный звонок',
  exhibition: 'Выставка',
  advertisement: 'Реклама',
  partner: 'Партнёр',
  other: 'Другое',
};

export const LEAD_RESULT_LABELS: Record<LeadResult, string> = {
  pending: 'В процессе',
  won: 'Выиграно',
  lost: 'Проиграно',
  deferred: 'Отложено',
};

// === Request Schemas ===

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  companyName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  trafficChannel: TrafficChannelSchema.default('other'),
  assignedTo: z.string().uuid().optional(),
  dealAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  nextContactDate: z.string().optional(),
});
export type CreateLeadRequest = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadSchema = CreateLeadSchema.partial().extend({
  result: LeadResultSchema.optional(),
  lostReason: z.string().optional(),
});
export type UpdateLeadRequest = z.infer<typeof UpdateLeadSchema>;

export const MoveLeadStageSchema = z.object({
  toStage: FunnelStageSchema,
  comment: z.string().optional(),
});
export type MoveLeadStageRequest = z.infer<typeof MoveLeadStageSchema>;

export const CreateSalesPlanSchema = z.object({
  managerId: z.string().uuid(),
  period: SalesPlanPeriodSchema,
  periodStart: z.string(),
  periodEnd: z.string(),
  targetAmount: z.number().min(0),
  targetCount: z.number().int().min(0).default(0),
});
export type CreateSalesPlanRequest = z.infer<typeof CreateSalesPlanSchema>;

export const UpdateSalesPlanSchema = CreateSalesPlanSchema.partial();
export type UpdateSalesPlanRequest = z.infer<typeof UpdateSalesPlanSchema>;

export const GrantCrmAccessSchema = z.object({
  userId: z.string().uuid(),
});
export type GrantCrmAccessRequest = z.infer<typeof GrantCrmAccessSchema>;

export const CrmLeadFiltersSchema = z.object({
  stage: FunnelStageSchema.optional(),
  trafficChannel: TrafficChannelSchema.optional(),
  result: LeadResultSchema.optional(),
  assignedTo: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type CrmLeadFilters = z.infer<typeof CrmLeadFiltersSchema>;
