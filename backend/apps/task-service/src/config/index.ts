import { z } from 'zod';

const ConfigSchema = z.object({
  port: z.number().default(3005),
  nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Database
  databaseUrl: z.string(),
  
  // Redis
  redisUrl: z.string(),
  
  // JWT
  jwtSecret: z.string(),
  jwtExpiresIn: z.string().default('15m'),
  
  // CORS
  corsOrigin: z.string().default('http://localhost:3000'),
  
  // Other services
  authServiceUrl: z.string().default('http://auth-service:3001'),
  userServiceUrl: z.string().default('http://user-service:3002'),
  notificationServiceUrl: z.string().default('http://notification-service:3006'),
  
  // Task settings
  defaultReminderDays: z.number().default(1),
  maxTaskDuration: z.number().default(365), // максимальная длительность задачи в днях
  maxAssignments: z.number().default(10),   // максимальное количество назначений на задачу
  
  // Logging
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Config = z.infer<typeof ConfigSchema>;

export const config: Config = ConfigSchema.parse({
  port: parseInt(process.env.PORT || '3005'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cube_demper',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  jwtSecret: process.env.JWT_SECRET || 'task-service-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
  
  defaultReminderDays: parseInt(process.env.DEFAULT_REMINDER_DAYS || '1'),
  maxTaskDuration: parseInt(process.env.MAX_TASK_DURATION || '365'),
  maxAssignments: parseInt(process.env.MAX_ASSIGNMENTS || '10'),
  
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
});
