import { z } from 'zod';

const ConfigSchema = z.object({
  port: z.number().default(3007),
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
  fileServiceUrl: z.string().default('http://file-service:3004'),
  notificationServiceUrl: z.string().default('http://notification-service:3006'),
  
  // Disciplinary settings
  defaultAppealDeadlineDays: z.number().default(15),
  maxEvidenceFiles: z.number().default(10),
  disciplinaryRecordRetentionYears: z.number().default(10),
  
  // Notification settings
  enableEmailNotifications: z.boolean().default(true),
  enableSmsNotifications: z.boolean().default(false),
  
  // Logging
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Config = z.infer<typeof ConfigSchema>;

export const config: Config = ConfigSchema.parse({
  port: parseInt(process.env.PORT || '3007'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/gov_platform',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  jwtSecret: process.env.JWT_SECRET || 'disciplinary-service-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://user-service:3002',
  fileServiceUrl: process.env.FILE_SERVICE_URL || 'http://file-service:3004',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
  
  defaultAppealDeadlineDays: parseInt(process.env.DEFAULT_APPEAL_DEADLINE_DAYS || '15'),
  maxEvidenceFiles: parseInt(process.env.MAX_EVIDENCE_FILES || '10'),
  disciplinaryRecordRetentionYears: parseInt(process.env.DISCIPLINARY_RECORD_RETENTION_YEARS || '10'),
  
  enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
  enableSmsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
  
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
});
