import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// Типы органов государственной власти
export const organizationTypeEnum = pgEnum('organization_type', [
  'presidency',           // Администрация Президента
  'parliament',          // Парламент 
  'government',          // Правительство
  'ministry',            // Министерство
  'committee',           // Комитет
  'agency',              // Агентство
  'department',          // Департамент
  'division',            // Отдел
  'sector',              // Сектор
  'group',               // Группа
  'regional_office',     // Территориальное управление
  'local_administration' // Местная администрация
]);

// Уровни в иерархии (0 - самый высокий)
export const hierarchyLevelEnum = pgEnum('hierarchy_level', [
  'level_0', // Президент
  'level_1', // Министерства, Комитеты 
  'level_2', // Департаменты
  'level_3', // Отделы
  'level_4', // Секторы
  'level_5', // Группы
  'level_6'  // Сотрудники
]);

// Основная таблица организационной структуры
export const governmentStructure = pgTable('government_structure', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Базовая информация
  name: varchar('name', { length: 300 }).notNull(),
  nameKk: varchar('name_kk', { length: 300 }), // На казахском языке
  nameEn: varchar('name_en', { length: 300 }), // На английском языке
  shortName: varchar('short_name', { length: 100 }),
  code: varchar('code', { length: 50 }).unique(), // Уникальный код (например, "MID_KZ")
  
  // Иерархическая структура
  parentId: uuid('parent_id').references(() => governmentStructure.id),
  level: hierarchyLevelEnum('level').notNull(),
  type: organizationTypeEnum('type').notNull(),
  path: text('path'), // Материализованный путь для быстрых запросов (/1/2/3/4)
  orderIndex: integer('order_index').default(0), // Порядок сортировки среди siblings
  
  // Контактная информация
  description: text('description'),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  
  // Руководство
  headUserId: uuid('head_user_id').references(() => users.id), // Руководитель
  deputyHeadUserId: uuid('deputy_head_user_id').references(() => users.id), // Заместитель
  
  // Метаданные
  isActive: boolean('is_active').default(true),
  establishedDate: timestamp('established_date'),
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Должности в государственной структуре
export const positionTypeEnum = pgEnum('position_type', [
  'president',              // Президент
  'prime_minister',         // Премьер-министр
  'deputy_prime_minister',  // Вице-премьер
  'minister',               // Министр
  'deputy_minister',        // Вице-министр
  'chairman',               // Председатель комитета
  'deputy_chairman',        // Заместитель председателя
  'head_of_department',     // Начальник департамента
  'deputy_head_department', // Заместитель начальника департамента
  'head_of_division',       // Начальник отдела
  'deputy_head_division',   // Заместитель начальника отдела
  'head_of_sector',         // Начальник сектора
  'leading_specialist',     // Ведущий специалист
  'chief_specialist',       // Главный специалист
  'senior_specialist',      // Старший специалист
  'specialist',             // Специалист
  'junior_specialist',      // Младший специалист
  'consultant',             // Консультант
  'advisor',                // Советник
  'assistant'               // Помощник
]);

// Категории госслужащих
export const civilServiceCategoryEnum = pgEnum('civil_service_category', [
  'political',          // Политические государственные служащие
  'administrative',     // Административные государственные служащие
  'corps_a',           // Корпус "А" (высшая категория)
  'corps_b',           // Корпус "Б" (средняя категория) 
  'corps_c'            // Корпус "В" (младшая категория)
]);

// Подкатегории корпусов
export const civilServiceSubcategoryEnum = pgEnum('civil_service_subcategory', [
  'corps_a1', 'corps_a2', 'corps_a3',
  'corps_b1', 'corps_b2', 'corps_b3', 'corps_b4', 'corps_b5',
  'corps_c1', 'corps_c2', 'corps_c3', 'corps_c4'
]);

// Должности государственных служащих
export const positions = pgTable('positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Основная информация о должности
  title: varchar('title', { length: 300 }).notNull(),
  titleKk: varchar('title_kk', { length: 300 }),
  titleEn: varchar('title_en', { length: 300 }),
  code: varchar('code', { length: 50 }).unique(),
  
  // Принадлежность к структуре
  organizationId: uuid('organization_id').notNull().references(() => governmentStructure.id),
  
  // Классификация должности
  type: positionTypeEnum('type').notNull(),
  category: civilServiceCategoryEnum('category').notNull(),
  subcategory: civilServiceSubcategoryEnum('subcategory'),
  rank: integer('rank'), // Ранг по табели о рангах
  
  // Иерархические связи должностей
  reportsToPositionId: uuid('reports_to_position_id').references(() => positions.id), // Непосредственный руководитель
  isManagerial: boolean('is_managerial').default(false), // Является ли должность руководящей
  canManageSubordinates: boolean('can_manage_subordinates').default(false),
  canAssignTasks: boolean('can_assign_tasks').default(false),
  canIssueDisciplinaryActions: boolean('can_issue_disciplinary_actions').default(false),
  
  // Требования к должности
  description: text('description'),
  requirements: text('requirements'), // Требования к образованию, опыту
  responsibilities: text('responsibilities'), // Должностные обязанности
  minExperience: integer('min_experience'), // Минимальный опыт работы (лет)
  salaryGrade: integer('salary_grade'), // Разряд оплаты труда
  
  // Количественные ограничения
  maxPositions: integer('max_positions').default(1), // Максимальное количество таких должностей в организации
  isUnique: boolean('is_unique').default(false), // Уникальная должность (например, министр)
  
  // Статус должности
  isActive: boolean('is_active').default(true),
  establishedDate: timestamp('established_date'),
  abolishedDate: timestamp('abolished_date'),
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Назначения на должности (история карьеры)
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Связи
  userId: uuid('user_id').notNull().references(() => users.id),
  positionId: uuid('position_id').notNull().references(() => positions.id),
  organizationId: uuid('organization_id').notNull().references(() => governmentStructure.id),
  
  // Детали назначения
  appointmentDate: timestamp('appointment_date').notNull(),
  dismissalDate: timestamp('dismissal_date'),
  isCurrent: boolean('is_current').default(true),
  
  // Тип назначения
  appointmentType: varchar('appointment_type', { length: 50 }).notNull(), // permanent, temporary, acting
  appointmentOrder: varchar('appointment_order', { length: 100 }), // Номер приказа о назначении
  dismissalOrder: varchar('dismissal_order', { length: 100 }), // Номер приказа об освобождении
  dismissalReason: varchar('dismissal_reason', { length: 200 }), // Причина освобождения
  
  // Дополнительная информация
  salary: integer('salary'),
  allowances: text('allowances'), // Надбавки и доплаты (JSON)
  workingConditions: text('working_conditions'), // Особые условия работы
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Делегирование полномочий
export const delegations = pgTable('delegations', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Участники делегирования
  delegatorUserId: uuid('delegator_user_id').notNull().references(() => users.id), // Кто делегирует
  delegateUserId: uuid('delegate_user_id').notNull().references(() => users.id),   // Кому делегируется
  
  // Объект делегирования
  organizationId: uuid('organization_id').references(() => governmentStructure.id),
  positionId: uuid('position_id').references(() => positions.id),
  
  // Временные рамки
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  
  // Делегируемые полномочия
  permissions: text('permissions'), // JSON массив полномочий
  restrictions: text('restrictions'), // Ограничения
  reason: varchar('reason', { length: 500 }), // Причина делегирования
  
  // Системные поля
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type GovernmentStructure = typeof governmentStructure.$inferSelect;
export type InsertGovernmentStructure = typeof governmentStructure.$inferInsert;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
export type Delegation = typeof delegations.$inferSelect;
export type InsertDelegation = typeof delegations.$inferInsert;
