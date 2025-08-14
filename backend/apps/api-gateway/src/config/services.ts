export interface ServiceConfig {
  name: string;
  url: string;
  timeout: number;
  retries: number;
  healthCheck: string;
  prefix: string;
}

export const services: ServiceConfig[] = [
  {
    name: 'auth-service',
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    timeout: 5000,
    retries: 3,
    healthCheck: '/api/v1/health',
    prefix: '/auth',
  },
  {
    name: 'user-service',
    url: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    timeout: 5000,
    retries: 3,
    healthCheck: '/api/v1/health',
    prefix: '/users',
  },
  {
    name: 'chat-service',
    url: process.env.CHAT_SERVICE_URL || 'http://localhost:3003',
    timeout: 10000,
    retries: 2,
    healthCheck: '/api/v1/health',
    prefix: '/chats',
  },
  {
    name: 'file-service',
    url: process.env.FILE_SERVICE_URL || 'http://localhost:3004',
    timeout: 30000, // Files can take longer
    retries: 2,
    healthCheck: '/api/v1/health',
    prefix: '/files',
  },
];

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // per IP
    skipSuccessfulRequests: false,
  },

  // CORS
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Health Check
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Circuit Breaker
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60000,
  },

  // Load Balancing
  loadBalancer: {
    strategy: 'round-robin' as const,
  },
};
