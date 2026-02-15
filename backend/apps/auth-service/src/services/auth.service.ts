import { v4 as uuidv4 } from 'uuid';
import { DatabaseConnection } from '@gov-platform/database';
import { users, sessions } from '@gov-platform/database';
import { eq, and } from 'drizzle-orm';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  User,
  Session,
} from '@gov-platform/types';
import { JwtUtils, JwtPayload } from '../utils/jwt';
import { CryptoUtils } from '../utils/crypto';
import { logger } from '../utils/logger';
import { config } from '../config';

export class AuthService {
  private db = DatabaseConnection.getInstance().getDb();
  private redis = DatabaseConnection.getInstance().getRedisClient();

  /**
   * Register a new user with email and password
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ userId: string }> {
    try {
      // Check if user already exists
      const [existing] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existing) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await CryptoUtils.hashPassword(data.password);

      // Create user
      const [newUser] = await this.db
        .insert(users)
        .values({
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'employee',
          status: 'active',
        })
        .returning({ id: users.id });

      logger.info('User registered', { userId: newUser.id, email: data.email });

      return { userId: newUser.id };
    } catch (error) {
      logger.error('Registration failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async loginByEmail(
    email: string,
    password: string,
    clientInfo: { ipAddress: string; userAgent: string }
  ): Promise<LoginResponse> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.passwordHash) {
        throw new Error('This account uses ЭЦП authentication');
      }

      if (user.status !== 'active') {
        throw new Error(`User account is ${user.status}`);
      }

      const isValid = await CryptoUtils.comparePassword(password, user.passwordHash);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await this.db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          isOnline: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Create session (same as ЭЦП flow)
      const sessionId = uuidv4();
      const jwtPayload: Omit<JwtPayload, 'type'> = {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId,
      };

      const accessToken = JwtUtils.generateAccessToken(jwtPayload);
      const refreshToken = JwtUtils.generateRefreshToken(jwtPayload);

      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + config.security.sessionTimeout);

      await this.db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        isActive: true,
      });

      await this.redis.setEx(
        `${config.redis.sessionPrefix}${sessionId}`,
        config.security.sessionTimeout / 1000,
        JSON.stringify({
          userId: user.id,
          sessionId,
          accessToken,
          refreshToken,
        })
      );

      logger.info('User logged in by email', {
        userId: user.id,
        email: user.email,
        sessionId,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: config.security.sessionTimeout / 1000,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      logger.error('Email login failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Authenticate user with digital signature
   */
  async login(loginData: LoginRequest, clientInfo: {
    ipAddress: string;
    userAgent: string;
  }): Promise<LoginResponse> {
    try {
      // Verify digital signature
      const isValidSignature = await CryptoUtils.verifyDigitalSignature(
        JSON.stringify({ timestamp: loginData.timestamp }),
        loginData.digitalSignature,
        loginData.publicKey
      );

      if (!isValidSignature) {
        throw new Error('Invalid digital signature');
      }

      // Find user by public key
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.digitalCertificate, loginData.publicKey))
        .limit(1);

      if (!user) {
        throw new Error('User not found or not registered');
      }

      if (user.status !== 'active') {
        throw new Error(`User account is ${user.status}`);
      }

      // Update last login
      await this.db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          isOnline: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Create new session
      const sessionId = uuidv4();
      const jwtPayload: Omit<JwtPayload, 'type'> = {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId,
      };

      const accessToken = JwtUtils.generateAccessToken(jwtPayload);
      const refreshToken = JwtUtils.generateRefreshToken(jwtPayload);

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + config.security.sessionTimeout);

      // Save session to database
      await this.db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        isActive: true,
      });

      // Cache session in Redis
      await this.redis.setEx(
        `${config.redis.sessionPrefix}${sessionId}`,
        config.security.sessionTimeout / 1000,
        JSON.stringify({
          userId: user.id,
          sessionId,
          accessToken,
          refreshToken,
        })
      );

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        sessionId,
        ipAddress: clientInfo.ipAddress,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: config.security.sessionTimeout / 1000,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      logger.error('Login failed', { error: (error as Error).message, loginData });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshData: RefreshTokenRequest): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      // Verify refresh token
      const payload = JwtUtils.verifyRefreshToken(refreshData.refreshToken);

      // Check if session exists and is active
      const [session] = await this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, payload.sessionId),
            eq(sessions.refreshToken, refreshData.refreshToken),
            eq(sessions.isActive, true)
          )
        )
        .limit(1);

      if (!session) {
        throw new Error('Invalid refresh token or session expired');
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await this.invalidateSession(payload.sessionId);
        throw new Error('Session expired');
      }

      // Generate new tokens
      const newJwtPayload: Omit<JwtPayload, 'type'> = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
      };

      const newAccessToken = JwtUtils.generateAccessToken(newJwtPayload);
      const newRefreshToken = JwtUtils.generateRefreshToken(newJwtPayload);

      // Update session with new tokens
      await this.db
        .update(sessions)
        .set({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, payload.sessionId));

      // Update Redis cache
      await this.redis.setEx(
        `${config.redis.sessionPrefix}${payload.sessionId}`,
        config.security.sessionTimeout / 1000,
        JSON.stringify({
          userId: payload.userId,
          sessionId: payload.sessionId,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      );

      logger.info('Token refreshed successfully', {
        userId: payload.userId,
        sessionId: payload.sessionId,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: config.security.sessionTimeout / 1000,
      };
    } catch (error) {
      logger.error('Token refresh failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(sessionId: string): Promise<void> {
    try {
      await this.invalidateSession(sessionId);
      logger.info('User logged out successfully', { sessionId });
    } catch (error) {
      logger.error('Logout failed', { error: (error as Error).message, sessionId });
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(userId: string): Promise<any | null> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user || null;
    } catch (error) {
      logger.error('Get current user failed', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      // Check Redis cache first
      const cachedSession = await this.redis.get(`${config.redis.sessionPrefix}${sessionId}`);
      if (cachedSession) {
        return true;
      }

      // Check database
      const [session] = await this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, sessionId),
            eq(sessions.isActive, true)
          )
        )
        .limit(1);

      if (!session || session.expiresAt < new Date()) {
        if (session) {
          await this.invalidateSession(sessionId);
        }
        return false;
      }

      // Refresh Redis cache
      await this.redis.setEx(
        `${config.redis.sessionPrefix}${sessionId}`,
        Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
        JSON.stringify({
          userId: session.userId,
          sessionId: session.id,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        })
      );

      return true;
    } catch (error) {
      logger.error('Session validation failed', { error: (error as Error).message, sessionId });
      return false;
    }
  }

  /**
   * Invalidate session
   */
  private async invalidateSession(sessionId: string): Promise<void> {
    // Remove from database
    await this.db
      .update(sessions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    // Remove from Redis
    await this.redis.del(`${config.redis.sessionPrefix}${sessionId}`);

    // Add to blacklist (for JWT validation)
    await this.redis.setEx(
      `${config.redis.blacklistPrefix}${sessionId}`,
      config.security.sessionTimeout / 1000,
      'true'
    );
  }

  /**
   * Check if session is blacklisted
   */
  async isSessionBlacklisted(sessionId: string): Promise<boolean> {
    const result = await this.redis.get(`${config.redis.blacklistPrefix}${sessionId}`);
    return result === 'true';
  }

  /**
   * Logout all sessions for user
   */
  async logoutAllSessions(userId: string): Promise<void> {
    try {
      // Get all active sessions for user
      const userSessions = await this.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.isActive, true)
          )
        );

      // Invalidate all sessions
      for (const session of userSessions) {
        await this.invalidateSession(session.id);
      }

      // Update user online status
      await this.db
        .update(users)
        .set({
          isOnline: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.info('All sessions logged out', { userId, sessionCount: userSessions.length });
    } catch (error) {
      logger.error('Logout all sessions failed', { error: (error as Error).message, userId });
      throw error;
    }
  }
}
