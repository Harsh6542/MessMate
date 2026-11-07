import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initSocket } from './sockets/index.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server instance
const httpServer = http.createServer(app);

// Initialize Socket.IO with WebSocket handshake auth
initSocket(httpServer);

const startServer = async () => {
  try {
    // Await database connection before accepting client traffic
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`[MessMate Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[MessMate Server] Real-time WebSockets initialized via Socket.IO`);
      console.log(`[MessMate Server] Health check available at http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error(`[Server Fatal Error] Failed to connect to database: ${err.message}`);
    console.error('[Server Fatal Error] Server stopped. Check your internet/hotspot connection and restart.');
    process.exit(1);
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
