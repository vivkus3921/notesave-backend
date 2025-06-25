// src/utils/jwt.ts
import * as jwt from 'jsonwebtoken';
import { IUser } from '../src/models/User';

export interface JWTPayload {
    userId: string;
    email: string;
    name?: string
}

export const generateToken = (user: IUser): string => {
    const payload: JWTPayload = {
        userId: user._id.toString(),
        email: user.email,
        name: user.name
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback-secret',
        {
            expiresIn: '7d'
        }
    );

};

export const verifyToken = (token: string): JWTPayload => {
    return jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
    ) as JWTPayload;
};

export const generateRefreshToken = (user: IUser): string => {
    const payload: JWTPayload = {
        userId: user._id.toString(),
        email: user.email
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback-secret',
        {
            expiresIn: '30d'
        }
    );
};