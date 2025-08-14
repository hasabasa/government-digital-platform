import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/gov_platform',
    ssl: process.env.NODE_ENV === 'production',
  },

  // Redis Configuration  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    cachePrefix: 'user:',
    cacheTtl: 3600, // 1 hour
  },

  // Auth Service Configuration
  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    timeout: 5000,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    avatarSizes: {
      thumbnail: { width: 64, height: 64 },
      small: { width: 128, height: 128 },
      medium: { width: 256, height: 256 },
      large: { width: 512, height: 512 },
    },
  },

  // Search Configuration
  search: {
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    userIndex: 'gov_users',
    maxResults: 50,
  },

  // Security Configuration
  security: {
    maxContactsPerUser: 1000,
    profileUpdateCooldown: 5 * 60 * 1000, // 5 minutes
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // more generous for user operations
    skipSuccessfulRequests: false,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};
