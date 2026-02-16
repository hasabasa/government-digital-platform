import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import { services, config } from '../config/services';
import { logger } from '../utils/logger';
import { HealthChecker } from '../utils/health-checker';

export class ProxyMiddleware {
  private healthChecker = new HealthChecker();

  /**
   * Create proxy middleware for a service
   */
  createServiceProxy(serviceName: string): any {
    const service = services.find(s => s.name === serviceName);
    
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const proxyOptions: Options = {
      target: service.url,
      changeOrigin: true,
      timeout: service.timeout,
      pathRewrite: {
        [`^/api/v1${service.prefix}`]: '/api/v1',
      },
      
      // Add headers
      onProxyReq: (proxyReq, req, res) => {
        // Forward original IP
        if (req.ip) {
          proxyReq.setHeader('X-Forwarded-For', req.ip);
          proxyReq.setHeader('X-Real-IP', req.ip);
        }
        proxyReq.setHeader('X-Gateway-Service', serviceName);
        
        // Log request
        logger.info('Proxying request', {
          service: serviceName,
          method: req.method,
          path: req.path,
          target: `${service.url}${proxyReq.path || ''}`,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      },

      // Handle responses
      onProxyRes: (proxyRes, req, res) => {
        // Add response headers
        proxyRes.headers['X-Gateway-Service'] = serviceName;
        proxyRes.headers['X-Response-Time'] = res.get('X-Response-Time') || '';
        
        logger.info('Proxy response', {
          service: serviceName,
          statusCode: proxyRes.statusCode,
          path: req.path,
          responseTime: res.get('X-Response-Time'),
        });
      },

      // Error handling
      onError: (err, req, res) => {
        logger.error('Proxy error', {
          service: serviceName,
          error: err.message,
          path: req.path,
          method: req.method,
        });

        // Check if service is healthy
        this.healthChecker.markServiceDown(serviceName);

        // Send error response
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable',
            service: serviceName,
            timestamp: new Date().toISOString(),
          });
        }
      },

      // Circuit breaker logic
      router: async (req) => {
        // Check if service is healthy
        const isHealthy = await this.healthChecker.isServiceHealthy(serviceName);
        
        if (!isHealthy) {
          throw new Error(`Service ${serviceName} is unhealthy`);
        }

        return service.url;
      },
    };

    return createProxyMiddleware(proxyOptions);
  }

  /**
   * WebSocket proxy for chat service
   */
  createWebSocketProxy(): any {
    const chatService = services.find(s => s.name === 'chat-service');
    
    if (!chatService) {
      throw new Error('Chat service not found for WebSocket proxy');
    }

    return createProxyMiddleware({
      target: chatService.url,
      changeOrigin: true,
      ws: true, // Enable WebSocket proxying
      
      onProxyReqWs: (proxyReq, req, socket) => {
        logger.info('WebSocket proxy request', {
          service: 'chat-service',
          url: req.url,
          origin: req.headers.origin,
        });
      },

      onError: (err, req, res) => {
        logger.error('WebSocket proxy error', {
          service: 'chat-service',
          error: err.message,
        });
      },
    });
  }

  /**
   * Health check middleware
   */
  healthCheckMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const healthStatus = await this.healthChecker.checkAllServices();
      
      const overallHealth = Object.values(healthStatus).every(status => status.healthy);
      
      res.status(overallHealth ? 200 : 503).json({
        success: overallHealth,
        timestamp: new Date().toISOString(),
        services: healthStatus,
        gateway: {
          healthy: true,
          uptime: process.uptime(),
          version: '0.1.0',
        },
      });
    } catch (error) {
      logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Service discovery middleware
   */
  serviceDiscoveryMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const availableServices = services.map(service => ({
      name: service.name,
      prefix: service.prefix,
      url: `${req.protocol}://${req.get('host')}/api/v1${service.prefix}`,
      healthy: this.healthChecker.getServiceStatus(service.name)?.healthy || false,
    }));

    res.json({
      success: true,
      gateway: 'Cube Demper OS API Gateway',
      version: '0.1.0',
      services: availableServices,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Request validation middleware
   */
  validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    // Check content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      
      if (!contentType) {
        res.status(400).json({
          success: false,
          error: 'Content-Type header is required',
        });
        return;
      }

      if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
        res.status(400).json({
          success: false,
          error: 'Unsupported Content-Type. Use application/json or multipart/form-data',
        });
        return;
      }
    }

    next();
  };

  /**
   * Security headers middleware
   */
  securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Gateway', 'cube-demper-api-gateway');
    
    next();
  };
}
