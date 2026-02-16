import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import responseTime from 'response-time';
import { config } from './config/services';
import { ProxyMiddleware } from './middleware/proxy.middleware';
import { logger } from './utils/logger';

export class APIGateway {
  private app: express.Application;
  private server: any;
  private proxyMiddleware: ProxyMiddleware;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.proxyMiddleware = new ProxyMiddleware();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Response time tracking
    this.app.use(responseTime((req, res, time) => {
      logger.info('Request completed', {
        method: req.method,
        path: (req as any).path,
        statusCode: res.statusCode,
        responseTime: `${time.toFixed(2)}ms`,
        ip: (req as any).ip,
        userAgent: (req as any).get('User-Agent'),
      });
    }));

    // Compression
    this.app.use(compression());

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors(config.cors));

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
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/discovery';
      },
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Custom security headers
    this.app.use(this.proxyMiddleware.securityHeaders);

    // Request validation
    this.app.use(this.proxyMiddleware.validateRequest);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: req.get('Content-Length'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', this.proxyMiddleware.healthCheckMiddleware);

    // Service discovery endpoint
    this.app.get('/api/discovery', this.proxyMiddleware.serviceDiscoveryMiddleware);

    // API documentation
    this.setupApiDocumentation();

    // Service proxies
    this.setupServiceProxies();

    // WebSocket proxy for chat service
    this.setupWebSocketProxy();

    // Catch-all route for 404
    this.app.use('*', (req, res) => {
      logger.warn('Route not found', {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
      });

      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        availableEndpoints: [
          '/health',
          '/api/discovery',
          '/api/v1/auth',
          '/api/v1/users',
          '/api/v1/chats',
          '/api/v1/files',
          '/api/v1/tasks',
          '/api/v1/calls',
          '/api/v1/finance',
        ],
      });
    });
  }

  private setupServiceProxies(): void {
    // Auth Service
    this.app.use(
      '/api/v1/auth',
      this.proxyMiddleware.createServiceProxy('auth-service')
    );

    // User Service
    this.app.use(
      '/api/v1/users',
      this.proxyMiddleware.createServiceProxy('user-service')
    );

    // Chat Service
    this.app.use(
      '/api/v1/chats',
      this.proxyMiddleware.createServiceProxy('chat-service')
    );

    // File Service
    this.app.use(
      '/api/v1/files',
      this.proxyMiddleware.createServiceProxy('file-service')
    );

    // Task Service
    this.app.use(
      '/api/v1/tasks',
      this.proxyMiddleware.createServiceProxy('task-service')
    );

    // Call Service
    this.app.use(
      '/api/v1/calls',
      this.proxyMiddleware.createServiceProxy('call-service')
    );

    // Finance Service
    this.app.use(
      '/api/v1/finance',
      this.proxyMiddleware.createServiceProxy('finance-service')
    );

    logger.info('Service proxies configured', {
      services: ['auth-service', 'user-service', 'chat-service', 'file-service', 'task-service', 'call-service', 'finance-service'],
    });
  }

  private setupWebSocketProxy(): void {
    // WebSocket proxy for chat service
    const wsProxy = this.proxyMiddleware.createWebSocketProxy();
    
    // Handle WebSocket upgrade
    this.server.on('upgrade', (request: any, socket: any, head: any) => {
      if (request.url?.startsWith('/socket.io')) {
        wsProxy.upgrade(request, socket, head);
      } else {
        socket.destroy();
      }
    });

    logger.info('WebSocket proxy configured for chat service');
  }

  private setupApiDocumentation(): void {
    // Simple API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Cube Demper OS API Gateway',
        version: '0.2.0',
        description: 'Unified API gateway for Cube Demper OS platform services',
        documentation: `${req.protocol}://${req.get('host')}/api/docs`,
        services: {
          auth: `${req.protocol}://${req.get('host')}/api/v1/auth`,
          users: `${req.protocol}://${req.get('host')}/api/v1/users`,
          chats: `${req.protocol}://${req.get('host')}/api/v1/chats`,
          files: `${req.protocol}://${req.get('host')}/api/v1/files`,
          tasks: `${req.protocol}://${req.get('host')}/api/v1/tasks`,
          calls: `${req.protocol}://${req.get('host')}/api/v1/calls`,
          finance: `${req.protocol}://${req.get('host')}/api/v1/finance`,
        },
        websocket: `${req.protocol.replace('http', 'ws')}://${req.get('host')}/socket.io`,
        support: {
          health: `${req.protocol}://${req.get('host')}/health`,
          discovery: `${req.protocol}://${req.get('host')}/api/discovery`,
        },
      });
    });

    // Swagger/OpenAPI documentation placeholder
    this.app.get('/api/docs', (req, res) => {
      res.json({
        message: 'API Documentation',
        note: 'Swagger/OpenAPI documentation would be implemented here',
        services: [
          'Auth Service - Authentication and authorization',
          'User Service - User management and profiles',
          'Chat Service - Real-time messaging',
          'File Service - File upload and management',
          'Task Service - Task management and assignments',
          'Call Service - Video/audio calls and Google Meet',
          'Finance Service - Financial operations, tariffs and payroll',
        ],
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
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        error: config.nodeEnv === 'production' 
          ? 'Internal server error' 
          : err.message,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
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
      // Start server
      this.server.listen(config.port, () => {
        logger.info(`API Gateway started on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info('Gateway endpoints:', {
          api: `http://localhost:${config.port}/api`,
          health: `http://localhost:${config.port}/health`,
          discovery: `http://localhost:${config.port}/api/discovery`,
        });
      });

    } catch (error) {
      logger.error('Failed to start API gateway', { error: (error as Error).message });
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    try {
      logger.info('Starting graceful shutdown...');

      // Close server
      this.server.close(() => {
        logger.info('Server closed');
      });

      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: (error as Error).message });
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}
