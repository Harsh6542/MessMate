import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './sockets/index.js';
import { backfillStaffCredentials } from './utils/staffBackfill.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server instance
const httpServer = http.createServer(app);

// Initialize Socket.IO with WebSocket handshake auth
initSocket(httpServer);

const startServer = async () => {
  // 1. Start HTTP server immediately so Render port-binding detects the service as Live
  httpServer.listen(PORT, () => {
    console.log(`[MessMate Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`[MessMate Server] Real-time WebSockets initialized via Socket.IO`);
    console.log(`[MessMate Server] Health check available on port ${PORT}`);
  });

  // 2. Connect to database with retry handling
  try {
    await connectDB();
    await backfillStaffCredentials();
  } catch (err) {
    console.error(`[Server Database Warning] Initial connection to database failed: ${err.message}`);
    console.error('[Server Database Warning] In MongoDB Atlas, ensure Network Access whitelist includes 0.0.0.0/0 (Allow Access from Anywhere).');
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] ${err.name}: ${err.message}`);
  console.error(err.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception] ${err.name}: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
