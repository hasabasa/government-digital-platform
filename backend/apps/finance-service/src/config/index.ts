import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3007', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cube_demper',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    jwtSecret: process.env.JWT_ACCESS_SECRET || 'dev-secret',
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
    },
};
