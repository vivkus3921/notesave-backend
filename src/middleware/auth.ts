// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import User, { IUser } from '../models/User';

// Extend Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        console.log('token is', token);

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
            return;
        }

        const decoded: JWTPayload = verifyToken(token);

        // Find user by ID
        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        if (!user.isVerified) {
            res.status(401).json({
                success: false,
                message: 'Please verify your email first'
            });
            return;
        }

        req.user = user;
        next();
    } catch (error: any) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
            return;
        }

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Token expired'
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded: JWTPayload = verifyToken(token);
            const user = await User.findById(decoded.userId);

            if (user && user.isVerified) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};