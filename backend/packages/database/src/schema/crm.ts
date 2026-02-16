import { pgTable, uuid, varchar, text, timestamp, boolean, integer, numeric, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

// === Enums ===

export const trafficChannelEnum = pgEnum('traffic_channel', [
  'website',
  'instagram',
  'telegram',
  'whatsapp',
  'facebook',
  'referral',
  'cold_call',
  'exhibition',
  'advertisement',
  'partner',
  'other',
]);

export const funnelStageEnum = pgEnum('funnel_stage', [
  'new',
  'contact',
  'negotiation',
  'proposal',
  'deal',
]);

export const leadResultEnum = pgEnum('lead_result', [
  'pending',
  'won',
  'lost',
  'deferred',
]);

export const salesPlanPeriodEnum = pgEnum('sales_plan_period', [
  'monthly',
  'quarterly',
]);

// === Лиды ===
export const crmLeads = pgTable('crm_leads', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Контактная информация
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  companyName: varchar('company_name', { length: 200 }),
  email: varchar('email', { length: 200 }),
  phone: varchar('phone', { length: 50 }),

  // Канал и воронка
  trafficChannel: trafficChannelEnum('traffic_channel').notNull().default('other'),
  stage: funnelStageEnum('stage').notNull().default('new'),
  result: leadResultEnum('result').notNull().default('pending'),

  // Менеджер
  assignedTo: uuid('assigned_to').references(() => users.id),

  // Сделка
  dealAmount: numeric('deal_amount', { precision: 14, scale: 2 }),
  dealCurrency: varchar('deal_currency', { length: 10 }).default('KZT'),

  // Дополнительно
  notes: text('notes'),
  tags: jsonb('tags').default([]),
  lostReason: text('lost_reason'),
  nextContactDate: timestamp('next_contact_date'),

  // Статус
  isActive: boolean('is_active').default(true),

  // Системные
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// === История стадий лидов ===
export const crmLeadHistory = pgTable('crm_lead_history', {
  id: uuid('id').primaryKey().defaultRandom(),

  leadId: uuid('lead_id').notNull().references(() => crmLeads.id, { onDelete: 'cascade' }),
  changedBy: uuid('changed_by').notNull().references(() => users.id),

  fromStage: funnelStageEnum('from_stage'),
  toStage: funnelStageEnum('to_stage').notNull(),
  comment: text('comment'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// === Планы продаж ===
export const crmSalesPlans = pgTable('crm_sales_plans', {
  id: uuid('id').primaryKey().defaultRandom(),

  managerId: uuid('manager_id').notNull().references(() => users.id),
  period: salesPlanPeriodEnum('period').notNull(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  targetAmount: numeric('target_amount', { precision: 14, scale: 2 }).notNull(),
  targetCount: integer('target_count').notNull().default(0),

  createdBy: uuid('created_by').notNull().references(() => users.id),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// === Контроль доступа к CRM ===
export const crmAccess = pgTable('crm_access', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: uuid('user_id').notNull().references(() => users.id),
  grantedBy: uuid('granted_by').notNull().references(() => users.id),

  isActive: boolean('is_active').default(true),

  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  revokedAt: timestamp('revoked_at'),
});

// === Export types ===
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;

export type CrmLeadHistory = typeof crmLeadHistory.$inferSelect;
export type InsertCrmLeadHistory = typeof crmLeadHistory.$inferInsert;

export type CrmSalesPlan = typeof crmSalesPlans.$inferSelect;
export type InsertCrmSalesPlan = typeof crmSalesPlans.$inferInsert;

export type CrmAccess = typeof crmAccess.$inferSelect;
export type InsertCrmAccess = typeof crmAccess.$inferInsert;
