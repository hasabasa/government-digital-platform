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
   * Register new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: 'Email, password, firstName and lastName are required',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters',
        });
        return;
      }

      const result = await this.authService.register({ email, password, firstName, lastName });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful',
      });
    } catch (error) {
      logger.error('Register controller error', { error: (error as Error).message });
      const status = (error as Error).message.includes('already exists') ? 409 : 500;
      res.status(status).json({
        success: false,
        error: (error as Error).message || 'Registration failed',
      });
    }
  };

  /**
   * Login with email and password
   */
  loginByEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      const clientInfo = {
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
      };

      const result = await this.authService.loginByEmail(email, password, clientInfo);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      logger.error('Email login controller error', { error: (error as Error).message });
      res.status(401).json({
        success: false,
        error: (error as Error).message || 'Login failed',
      });
    }
  };

  /**
   * Login with digital signature (legacy)
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
