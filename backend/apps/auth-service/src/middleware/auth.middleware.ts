import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '../utils/jwt';
import { AuthService } from '../services/auth.service';
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
  private static authService = new AuthService();

  /**
   * Authenticate request using JWT token
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

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify JWT token
      const payload = JwtUtils.verifyAccessToken(token);

      // Check if session is blacklisted
      const isBlacklisted = await AuthMiddleware.authService.isSessionBlacklisted(payload.sessionId);
      if (isBlacklisted) {
        res.status(401).json({
          success: false,
          error: 'Session has been invalidated',
        });
        return;
      }

      // Validate session
      const isValidSession = await AuthMiddleware.authService.validateSession(payload.sessionId);
      if (!isValidSession) {
        res.status(401).json({
          success: false,
          error: 'Session expired or invalid',
        });
        return;
      }

      // Add user info to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
      };

      next();
    } catch (error) {
      logger.error('Authentication failed', { error: (error as Error).message });
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  }

  /**
   * Authorize request based on user roles
   */
  static authorize(allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization failed', {
          userId: req.user.userId,
          role: req.user.role,
          allowedRoles,
        });
        
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      next();
    };
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
