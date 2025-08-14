import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3003,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/gov_platform',
    ssl: process.env.NODE_ENV === 'production',
  },

  // Redis Configuration  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    chatRoomPrefix: 'chat:room:',
    userConnectionPrefix: 'chat:user:',
    messagePrefix: 'chat:message:',
    typingPrefix: 'chat:typing:',
    cacheTtl: 3600,
  },

  // Auth Service Configuration
  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    timeout: 5000,
  },

  // WebSocket Configuration
  websocket: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxConnections: 10000,
  },

  // E2E Encryption Configuration
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    enabled: process.env.E2E_ENCRYPTION_ENABLED !== 'false',
  },

  // Message Configuration
  message: {
    maxLength: 4000,
    maxFiles: 10,
    retentionDays: 90,
    editTimeLimit: 5 * 60 * 1000, // 5 minutes
    deleteTimeLimit: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Chat Configuration
  chat: {
    maxParticipants: 1000,
    maxDirectChats: 500,
    messageHistoryLimit: 100,
    typingTimeout: 3000,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500, // more generous for chat operations
    messageRateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxMessages: 30, // 30 messages per minute
    },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // File Service Configuration
  fileService: {
    url: process.env.FILE_SERVICE_URL || 'http://localhost:3004',
    timeout: 10000,
  },

  // Notification Configuration
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
    rabbitMqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    notificationExchange: 'notifications',
  },
};
