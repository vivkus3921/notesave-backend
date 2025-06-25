
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import cookieParser from 'cookie-parser';
import connectDB from './config/database'

// Load environment variables
dotenv.config();

const app = express();

console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
}

// Middleware
app.use(cors(corsOptions));

// Add this after app.use(cors(corsOptions));


app.use(cookieParser());
app.use(express.json());
app.set('trust proxy', 1);

// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
    res.send('<h1>Hii I am Running<h1>');
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// 404 handler




// import connectDB from '../config/database';



dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default server;