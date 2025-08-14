import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes } from './routes';
import { logger } from './utils/logger';
import { config } from './config';
import { DatabaseConnection, getDefaultConfig } from '@gov-platform/database';
import { SocketHandler } from './websocket/socket.handler';

export class ChatApp {
  private app: express.Application;
  private server: any;
  private io: Server;
  private dbConnection: DatabaseConnection;
  private socketHandler: SocketHandler;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: config.websocket.cors,
      pingTimeout: config.websocket.pingTimeout,
      pingInterval: config.websocket.pingInterval,
      maxHttpBufferSize: 1e6, // 1MB
      transports: ['websocket', 'polling'],
    });
    
    this.dbConnection = DatabaseConnection.getInstance(getDefaultConfig());
    this.socketHandler = new SocketHandler(this.io);
    
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
          connectSrc: ["'self'", "ws:", "wss:"],
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

    // Rate limiting for API routes
    const apiLimiter = rateLimit({
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
        return req.path === '/health' || req.path === '/api/v1/health';
      },
    });

    // Message rate limiting
    const messageLimiter = rateLimit({
      windowMs: config.rateLimit.messageRateLimit.windowMs,
      max: config.rateLimit.messageRateLimit.maxMessages,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Too many messages, please slow down',
      },
      keyGenerator: (req) => {
        // Use user ID for rate limiting if available
        return (req as any).user?.userId || req.ip;
      },
    });

    this.app.use('/api', apiLimiter);
    this.app.use('/api/v1/chats/messages', messageLimiter);

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

    // WebSocket info endpoint
    this.app.get('/socket.io/info', (req, res) => {
      res.json({
        success: true,
        socketEnabled: true,
        transports: ['websocket', 'polling'],
        pingTimeout: config.websocket.pingTimeout,
        pingInterval: config.websocket.pingInterval,
      });
    });

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

    // Socket.IO error handling
    this.io.engine.on('connection_error', (err) => {
      logger.error('Socket.IO connection error', {
        error: err.message,
        code: err.code,
        context: err.context,
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
      this.server.listen(config.port, () => {
        logger.info(`Chat service started on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info('WebSocket server ready for connections');
      });

      // Socket.IO connection logging
      this.io.on('connection', (socket) => {
        logger.info('Socket.IO client connected', {
          socketId: socket.id,
          transport: socket.conn.transport.name,
          upgradeTime: (socket.conn as any).upgradeTime,
        });

        socket.on('disconnect', (reason) => {
          logger.info('Socket.IO client disconnected', {
            socketId: socket.id,
            reason,
          });
        });
      });

    } catch (error) {
      const err = error as Error;
      logger.error('Failed to start chat service', { error: err.message });
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    try {
      logger.info('Starting graceful shutdown...');

      // Close Socket.IO server
      this.io.close(() => {
        logger.info('Socket.IO server closed');
      });

      // Close HTTP server
      this.server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close database connections
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

  public getIO(): Server {
    return this.io;
  }
}
