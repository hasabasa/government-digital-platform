import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { routes } from './routes';
import { logger } from './utils/logger';
import { config } from './config';

export class CrmApp {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
        this.app.use(helmet());

        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));

        const limiter = rateLimit({
            windowMs: config.rateLimit.windowMs,
            max: config.rateLimit.maxRequests,
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => req.path === '/health' || req.path.includes('/health'),
        });
        this.app.use(limiter);

        this.app.use(express.json({ limit: '1mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        this.app.use((req, _res, next) => {
            logger.info('Incoming request', {
                method: req.method,
                url: req.url,
                ip: req.ip,
            });
            next();
        });
    }

    private setupRoutes(): void {
        this.app.use('/api/v1', routes);

        this.app.use('*', (_req, res) => {
            res.status(404).json({
                success: false,
                error: 'Route not found',
            });
        });
    }

    private setupErrorHandling(): void {
        this.app.use((
            err: Error,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction
        ) => {
            logger.error('Unhandled error', { error: err.message, stack: err.stack });
            res.status(500).json({
                success: false,
                error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
            });
        });
    }

    public async start(): Promise<void> {
        this.app.listen(config.port, () => {
            logger.info(`CRM service started on port ${config.port}`);
            logger.info(`Environment: ${config.nodeEnv}`);
        });
    }

    public getApp(): express.Application {
        return this.app;
    }
}
