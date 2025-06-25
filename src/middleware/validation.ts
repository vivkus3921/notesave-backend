// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Validation error handler
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : 'unknown',
            message: error.msg
        }));

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
        return;
    }

    next();
};

// User registration validation
export const validateUserRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),

    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
       

    handleValidationErrors
];

// User login validation
export const validateUserLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// OTP validation
export const validateOTP = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('otp')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),

    handleValidationErrors
];

// Note validation
export const validateNote = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),

    body('content')
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Content must be between 1 and 5000 characters'),

    handleValidationErrors
];

// Note update validation (optional fields)
export const validateNoteUpdate = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Title must be between 1 and 100 characters'),

    body('content')
        .optional()
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Content must be between 1 and 5000 characters'),

    handleValidationErrors
];

// Google auth validation
export const validateGoogleAuth = [
    body('token')
        .notEmpty()
        .withMessage('Google token is required'),

    handleValidationErrors
];

// Resend OTP validation
export const validateResendOTP = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    handleValidationErrors
];