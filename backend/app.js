import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectToSocket from "./src/controllers/socketManager.js";
import meetingRoutes from "./src/routes/meeting.routes.js";
import meetingSecurityRoutes from "./src/routes/meetingSecurity.routes.js";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler.js";
import { requestLogger } from "./src/middlewares/logger.js";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", process.env.PORT || 4000);

// Configure CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Health check endpoint
app.get("/", (req, res) => {
  return res.json({
    status: "ok",
    message: "NexMeet API Server",
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Meeting routes
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/security", meetingSecurityRoutes);

// 404 Handler - Must be after all routes
app.use(notFoundHandler);

// Global Error Handler - Must be last
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(error.name, error.message);
  console.error(error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error('Reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Performing graceful shutdown...');
  server.close(() => {
    console.log('💤 Server closed');
    mongoose.connection.close(false, () => {
      console.log('💤 Database connection closed');
      process.exit(0);
    });
  });
});

const start = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    const connectionDb = await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Database connected successfully");
    server.listen(app.get("port"), () => {
      console.log(`🚀 Server is running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
}
start();