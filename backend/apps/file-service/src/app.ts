import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes } from './routes';
import { logger } from './utils/logger';
import { config } from './config';
import { DatabaseConnection, getDefaultConfig } from '@cube-demper/database';

export class FileApp {
  private app: express.Application;
  private dbConnection: DatabaseConnection;

  constructor() {
    this.app = express();
    this.dbConnection = DatabaseConnection.getInstance(getDefaultConfig());
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many requests, please try again later',
      },
      skip: (req) => {
        return req.path === '/health' || req.path === '/api/v1/health';
      },
    });

    // Upload rate limiting
    const uploadLimiter = rateLimit({
      windowMs: config.rateLimit.uploadRateLimit.windowMs,
      max: config.rateLimit.uploadRateLimit.maxUploads,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many uploads, please try again later',
      },
      keyGenerator: (req) => {
        return (req as any).user?.userId || req.ip;
      },
    });

    this.app.use(limiter);
    this.app.use('/api/v1/files/upload', uploadLimiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api/v1', routes);

    // Catch-all route for 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
      });

      res.status(500).json({
        success: false,
        error: config.nodeEnv === 'production' 
          ? 'Internal server error' 
          : err.message,
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
      process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to databases
      await this.dbConnection.connect();
      logger.info('Database connections established');

      // Start server
      const server = this.app.listen(config.port, () => {
        logger.info(`File service started on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
      });

    } catch (error) {
      const err = error as Error;
      logger.error('Failed to start file service', { error: err.message });
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    try {
      await this.dbConnection.disconnect();
      logger.info('Database connections closed');
      process.exit(0);
    } catch (error) {
      const err = error as Error;
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}
