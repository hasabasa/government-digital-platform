import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class AuthMiddleware {
  static authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authorization token required',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        req.user = {
          id: decoded.userId || decoded.id,
          email: decoded.email,
          role: decoded.role,
        };
        next();
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error',
      });
    }
  };

  static requireManagerial = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // In a real implementation, this would check the user's position
    // For now, we'll check if they have admin or moderator role
    const managerialRoles = ['admin', 'moderator', 'department_head', 'government_official'];
    
    if (!managerialRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Managerial position required to perform disciplinary actions',
      });
    }

    next();
  };
}

// Extend Request type globally for this service
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
