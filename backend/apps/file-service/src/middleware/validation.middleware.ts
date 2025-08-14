import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

export class ValidationMiddleware {
  static validateBody(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.body);
        req.body = validatedData;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const errors = error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          }));

          logger.warn('Request validation failed', { errors, body: req.body });

          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors,
          });
        } else {
          logger.error('Validation middleware error', { error: (error as Error).message });
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          });
        }
      }
    };
  }

  static validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.query);
        req.query = validatedData;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const errors = error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          }));

          logger.warn('Query validation failed', { errors, query: req.query });

          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors,
          });
        } else {
          logger.error('Validation middleware error', { error: (error as Error).message });
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          });
        }
      }
    };
  }

  static validateParams(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.params);
        req.params = validatedData;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const errors = error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          }));

          logger.warn('Params validation failed', { errors, params: req.params });

          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors,
          });
        } else {
          logger.error('Validation middleware error', { error: (error as Error).message });
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          });
        }
      }
    };
  }
}
