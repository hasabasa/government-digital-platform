import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export class AuthMiddleware {
    static authenticate(req: Request, res: Response, next: NextFunction): void {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Access token required',
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
            (req as any).user = decoded;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }
    }

    static requireAdmin(req: Request, res: Response, next: NextFunction): void {
        const user = (req as any).user;
        if (!user || user.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Admin access required',
            });
            return;
        }
        next();
    }
}
