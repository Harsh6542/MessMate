import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

let io = null;

export const initSocket = (httpServer) => {
  const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const allowedOrigins = rawClientUrl.split(',').map((u) => u.trim().replace(/\/$/, ''));

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Extract from cookie if not explicitly passed in handshake auth
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of cookies) {
          const [key, val] = cookie.trim().split('=');
          if (key === 'messmate_jwt') {
            token = val;
            break;
          }
        }
      }

      if (!token) {
        return next(new Error('Authentication required for socket connection'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'messmate_dev_jwt_secret_key_change_in_production_2026_super_secure'
      );

      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid socket credentials'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket.IO] Connected: ${user.firstName} (${user.role}) - Socket ID: ${socket.id}`);

    // Join user-specific private room
    socket.join(`user:${user._id.toString()}`);

    // Join role room
    socket.join(`role:${user.role}`);

    // Join hostel room
    if (user.hostel) {
      socket.join(`hostel:${user.hostel.toString()}`);
    }

    // Join mess room
    if (user.mess) {
      socket.join(`mess:${user.mess.toString()}`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Disconnected: ${user.firstName}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

export const emitToUser = (userId, event, payload) => {
  if (io) {
    io.to(`user:${userId.toString()}`).emit(event, payload);
  }
};

export const emitToRole = (role, event, payload) => {
  if (io) {
    io.to(`role:${role}`).emit(event, payload);
  }
};

export const emitToRoom = (room, event, payload) => {
  if (io) {
    io.to(room).emit(event, payload);
  }
};

