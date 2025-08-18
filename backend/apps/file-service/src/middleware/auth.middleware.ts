import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

export class AuthMiddleware {
  /**
   * Authenticate request by validating with Auth Service
   */
  static async authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Authorization header missing or invalid',
        });
        return;
      }

      const token = authHeader.substring(7);

      // Validate token with Auth Service
      const authResponse = await axios.get(
        `${config.authService.url}/api/v1/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: config.authService.timeout,
        }
      );

      if (!authResponse.data.success || !authResponse.data.data) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
        return;
      }

      const user = authResponse.data.data;
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: user.sessionId || 'unknown',
      };

      next();
    } catch (error) {
      logger.error('Authentication failed', { error: (error as Error).message });
      
      if ((error as any).response?.status === 401) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Authentication service unavailable',
        });
      }
    }
  }

  /**
   * Optional authentication middleware
   */
  static async optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        await AuthMiddleware.authenticate(req, res, next);
      } catch (error) {
        // If authentication fails, continue without user info
        next();
      }
    } else {
      next();
    }
  }
}
