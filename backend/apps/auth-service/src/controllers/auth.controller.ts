import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import {
  LoginRequest,
  RefreshTokenRequest,
  ApiResponse,
  LoginResponse,
} from '@gov-platform/types';

export class AuthController {
  private authService = new AuthService();

  /**
   * Login with digital signature
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;
      const clientInfo = {
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
      };

      const result = await this.authService.login(loginData, clientInfo);

      const response: ApiResponse<LoginResponse> = {
        success: true,
        data: result,
        message: 'Login successful',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Login controller error', { error: (error as Error).message });
      
      const response: ApiResponse<never> = {
        success: false,
        error: (error as Error).message || 'Login failed',
      };

      res.status(401).json(response);
    }
  };

  /**
   * Refresh access token
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshData: RefreshTokenRequest = req.body;
      const result = await this.authService.refreshToken(refreshData);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Refresh controller error', { error: (error as Error).message });
      
      const response: ApiResponse<never> = {
        success: false,
        error: (error as Error).message || 'Token refresh failed',
      };

      res.status(401).json(response);
    }
  };

  /**
   * Logout current session
   */
  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      await this.authService.logout(req.user.sessionId);

      const response: ApiResponse<never> = {
        success: true,
        message: 'Logout successful',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Logout controller error', { error: (error as Error).message });
      
      const response: ApiResponse<never> = {
        success: false,
        error: (error as Error).message || 'Logout failed',
      };

      res.status(500).json(response);
    }
  };

  /**
   * Get current user information
   */
  getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const user = await this.authService.getCurrentUser(req.user.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get current user controller error', { error: (error as Error).message });
      
      const response: ApiResponse<never> = {
        success: false,
        error: (error as Error).message || 'Failed to get user information',
      };

      res.status(500).json(response);
    }
  };

  /**
   * Logout all sessions
   */
  logoutAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      await this.authService.logoutAllSessions(req.user.userId);

      const response: ApiResponse<never> = {
        success: true,
        message: 'All sessions logged out successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Logout all controller error', { error: (error as Error).message });
      
      const response: ApiResponse<never> = {
        success: false,
        error: (error as Error).message || 'Failed to logout all sessions',
      };

      res.status(500).json(response);
    }
  };

  /**
   * Health check endpoint
   */
  health = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      message: 'Auth service is healthy',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '0.1.0',
    });
  };
}
