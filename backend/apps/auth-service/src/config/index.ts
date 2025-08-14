import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key-very-long-and-secure',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-very-long-and-secure',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'gov-platform',
    audience: process.env.JWT_AUDIENCE || 'gov-platform-users',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/gov_platform',
    ssl: process.env.NODE_ENV === 'production',
  },

  // Redis Configuration  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    sessionPrefix: 'sess:',
    blacklistPrefix: 'blacklist:',
  },

  // Digital Signature Configuration
  digitalSignature: {
    algorithm: 'GOST_3410_2012_256',
    hashAlgorithm: 'GOST_3411_2012_256',
    certificateValidityDays: 365,
  },

  // Security Configuration
  security: {
    bcryptRounds: 12,
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: false,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};
