import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import hostelRoutes from './routes/hostelRoutes.js';
import messRoutes from './routes/messRoutes.js';
import userRoutes from './routes/userRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import mealSessionRoutes from './routes/mealSessionRoutes.js';
import declarationRoutes from './routes/declarationRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import demandRoutes from './routes/demandRoutes.js';
import wasteLogRoutes from './routes/wasteLogRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import guestMealRoutes from './routes/guestMealRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/AppError.js';
import { mongoSanitize } from './middleware/mongoSanitize.js';

const app = express();

// 1. Security HTTP headers
app.use(helmet());

// 2. Hardened CORS configuration with origin validation
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  ...rawClientUrl.split(',').map((u) => u.trim().replace(/\/$/, '')),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (mobile, server-to-server, curl)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, '');

      // Check explicit whitelist
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Allow official Vercel preview & production deployments
      if (/\.vercel\.app$/i.test(new URL(cleanOrigin).hostname)) {
        return callback(null, true);
      }

      // Allow Render internal origin
      if (/\.onrender\.com$/i.test(new URL(cleanOrigin).hostname)) {
        return callback(null, true);
      }

      // Reject untrusted external origins to prevent CSRF / credential leaks
      return callback(new AppError(`Cross-Origin Request Blocked: Origin ${origin} not authorized by CORS policy.`, 403, 'CORS_REJECTED'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-mode']
  })
);

// 3. Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 4. Rate limiting for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP. Please try again after 15 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// 5. Body Parsers, Cookie Parser & NoSQL Injection Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize);

// 6. Health check route
app.get('/api/v1/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    message: 'MessMate API is healthy and operational.',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 7. Core Application Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hostels', hostelRoutes);
app.use('/api/v1/mess', messRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/menus', menuRoutes);
app.use('/api/v1/meal-sessions', mealSessionRoutes);
app.use('/api/v1/declarations', declarationRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/demand', demandRoutes);
app.use('/api/v1/kitchen', demandRoutes);
app.use('/api/v1/waste-logs', wasteLogRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/guest-meals', guestMealRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 8. 404 handler for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server.`, 404, 'NOT_FOUND'));
});

// 9. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;

