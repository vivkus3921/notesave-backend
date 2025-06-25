// src/controllers/authController.ts
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { emailService, generateOTP } from '../utils/email';
import { CookieOptions } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import * as cookie from 'cookie';

dotenv.config();


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register user with email
export const registerUser = async (req: Request, res: Response):Promise<any> => {
    
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }   

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            otp,
            otpExpires,
            isVerified: false,
            isGoogleUser: false
        });

        // Send OTP email
        
        await emailService.sendOTP(email, otp);
       

        return res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for verification code.',
            data: {
                userId: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error:any) {
        console.log(error.message || error);
        return res.status(500).json({
            success: false,
            message: 'Failed to register user',
            error: error.message || 'Internal Server Error'
        });
    }
  
};

// Verify OTP
export const verifyOTP = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            otp,
            otpExpires: { $gt: new Date() }
        }).select('+otp +otpExpires');

        if (!user) {
           return res.status(400).json({
               success: false,
               message: 'Invalid or expired OTP'
              });
        }

        // Update user verification status
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerified
                },
                refreshToken
            }
        });
    } catch (error:any) {
        console.error('Error in verifyOTP:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify OTP',
            error: error.message || 'Internal Server Error'
        });
    }
    
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email, isVerified: false });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or already verified'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send OTP email
        await emailService.sendOTP(email, otp);

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully'
        });
    } catch (error:any) {
        console.error('Error in resendOTP:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: error.message || 'Internal Server Error'
        }); 
    }
   
};

// Login user
export const loginUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email first'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
           return res.status(401).json({
               success: false,
               message: 'Invalid email or password'
                });
        }

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        

        const cookieString = cookie.serialize('token', token, {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
            expires: new Date(Date.now() + 3* 24 * 60 * 60 * 1000),
            path: '/'
        });

        res.setHeader('Set-Cookie', cookieString);


       return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerified
                },
                refreshToken
            }
        });
    } catch (error:any) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message || 'Internal Server Error' 
        });
    }
   

};

// Google OAuth login


export const googleAuth = async (req: Request, res: Response):Promise<any> => {
    const { code } = req.body;
    
    try {

        console.log('I Entered in googleAuth function');
        // 1. Exchange code for tokens
        const tokenResponse = await axios.post(
            'https://oauth2.googleapis.com/token',
            {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
                grant_type: 'authorization_code',
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const { id_token, access_token } = tokenResponse.data;

        // 2. Decode ID token to get user info
        const ticket = await googleClient.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }

        const { sub: googleId, email, name, email_verified } = payload;

        if (!email_verified) {
            return res.status(400).json({ success: false, message: 'Email not verified' });
        }

        // 3. User logic (same as your code)
        let user = await User.findOne({ email });
        if (user) {
            if (!user.isGoogleUser) {
                user.isGoogleUser = true;
                user.googleId = googleId;
                user.isVerified = true;
                await user.save();
            }
        } else {
            user = await User.create({
                name: name || 'Google User',
                email,
                googleId,
                isGoogleUser: true,
                isVerified: true
            });
        }

        // 4. Generate tokens and set cookie
        const tokenjwt = generateToken(user);
        const refreshToken = generateRefreshToken(user);

       

        res.cookie('token', tokenjwt, {
            sameSite: 'none',
            secure: true,
            httpOnly: true,
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 1 day
        });

        return res.status(200).json({
            success: true,
            message: 'Google auth successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isVerified: user.isVerified,
                },
                refreshToken
            }
        });

    } catch (err: any) {
        console.error('OAuth error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Google login failed',
        });
    }
};


// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<any> => {
    try {
        const user = req.user;

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user!._id,
                    name: user!.name,
                    email: user!.email,
                    isVerified: user!.isVerified,
                    isGoogleUser: user!.isGoogleUser
                }
            }
        }); 
    } catch (error:any) {
        console.log(error || error.message)
        return res.status(500).json({
            success: false, 
            message: 'Failed to get current user',
            error: error.message || 'Internal Server Error'
        });
    }
   
};

// Logout user (optional - mainly for clearing client-side tokens)
export const logoutUser = async (req: Request, res: Response): Promise<any> => {
    
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
    });

    return res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};