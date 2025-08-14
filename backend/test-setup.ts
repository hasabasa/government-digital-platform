import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db } from '@gov-platform/database';

// Глобальная настройка тестовой среды
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Устанавливаем тестовую БД
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/gov_platform_test';
  
  // Проверяем подключение к БД
  try {
    await db.select().from(db._.users).limit(1);
    console.log('✅ Test database connection established');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Закрываем соединения с БД
  try {
    await db.$client.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
});

// Настройка для каждого теста
beforeEach(async () => {
  // Любая настройка перед каждым тестом
});

afterEach(async () => {
  // Очистка после каждого теста
});

// Мокаем внешние сервисы
global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
  console.log(`Mocked fetch call to: ${url}`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    data: {} 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Мокаем логгер
const mockLogger = {
  info: (...args: any[]) => console.log('[TEST LOG]', ...args),
  error: (...args: any[]) => console.error('[TEST ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[TEST WARN]', ...args),
  debug: (...args: any[]) => console.debug('[TEST DEBUG]', ...args)
};

global.console = {
  ...console,
  ...mockLogger
};
