import { pgTable, uuid, varchar, text, timestamp, integer, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// === Тарифы ===
export const tariffNameEnum = pgEnum('tariff_name', [
    'basic',     // 21 990 тг
    'standard',  // 27 990 тг
    'premium',   // 33 990 тг
]);

// === Тип транзакции ===
export const transactionTypeEnum = pgEnum('transaction_type', [
    'revenue',      // Поступление от продажи
    'bank_fee',     // Банковская комиссия (2%)
    'tax',          // Налог (4%)
    'ambassador',   // Выплата амбассадору (20%)
    'payout',       // Выплата дольщику
]);

// === Дольщики ===
export const shareholderNameEnum = pgEnum('shareholder_name', [
    'khasenkhan',  // Хасенхан (40%)
    'adil',        // Адиль (40%)
    'azamat',      // Азамат (20%)
]);

// ==========================================
// Записи продаж (ввод данных из «Кассы»)
// ==========================================
export const salesEntries = pgTable('sales_entries', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Кто внёс запись
    createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id),

    // Количество продаж по тарифам
    basicCount: integer('basic_count').notNull().default(0),
    standardCount: integer('standard_count').notNull().default(0),
    premiumCount: integer('premium_count').notNull().default(0),

    // Расчётные поля
    grossRevenue: numeric('gross_revenue', { precision: 12, scale: 2 }).notNull(),
    bankFee: numeric('bank_fee', { precision: 12, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull(),
    ambassadorFee: numeric('ambassador_fee', { precision: 12, scale: 2 }).notNull(),
    netProfit: numeric('net_profit', { precision: 12, scale: 2 }).notNull(),

    // Дата продаж (может отличаться от даты создания)
    salesDate: timestamp('sales_date').notNull(),
    note: text('note'),

    // Системные поля
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==========================================
// Транзакции (полная история движений денег)
// ==========================================
export const transactions = pgTable('transactions', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Связь с записью продажи
    salesEntryId: uuid('sales_entry_id').notNull().references(() => salesEntries.id, { onDelete: 'cascade' }),

    // Тип транзакции
    type: transactionTypeEnum('type').notNull(),

    // Сумма (положительная = приход, отрицательная = расход)
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),

    // Описание
    description: varchar('description', { length: 500 }),

    // Дольщик (если тип = payout)
    shareholderName: shareholderNameEnum('shareholder_name'),

    // Системные поля
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==========================================
// Баланс дольщиков (текущее состояние)
// ==========================================
export const shareholderBalances = pgTable('shareholder_balances', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Дольщик
    name: shareholderNameEnum('name').notNull().unique(),

    // Текущий баланс
    totalEarned: numeric('total_earned', { precision: 14, scale: 2 }).notNull().default('0'),
    totalWithdrawn: numeric('total_withdrawn', { precision: 14, scale: 2 }).notNull().default('0'),
    currentBalance: numeric('current_balance', { precision: 14, scale: 2 }).notNull().default('0'),

    // Системные поля
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==========================================
// Export types
// ==========================================
export type SalesEntry = typeof salesEntries.$inferSelect;
export type InsertSalesEntry = typeof salesEntries.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export type ShareholderBalance = typeof shareholderBalances.$inferSelect;
export type InsertShareholderBalance = typeof shareholderBalances.$inferInsert;
