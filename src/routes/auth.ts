// src/routes/auth.ts
import { Router } from 'express';
import {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    googleAuth,
    getCurrentUser,
    logoutUser
} from '../controllers/authController';
import {
    validateUserRegistration,
    validateUserLogin,
    validateOTP,
    validateGoogleAuth,
    validateResendOTP
} from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', validateUserRegistration, registerUser);
router.post('/verify-otp', validateOTP, verifyOTP);
router.post('/resend-otp', validateResendOTP, resendOTP);
router.post('/login', validateUserLogin, loginUser);
router.post('/google', googleAuth);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logoutUser);

export default router;