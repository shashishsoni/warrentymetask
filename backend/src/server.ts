import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

// Import routes
import indexRoutes from './routes/index';
import authRoutes from './routes/auth.routes';
import letterRoutes from './routes/letter.routes';
import driveRoutes from './routes/drive.routes';

// Initialize Express app
const app: Express = express();

// IMPORTANT: For Render deployment - use the PORT env var they provide
// Render requires this exact format
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

console.log(`Starting server with PORT=${PORT} (${typeof PORT})`);
console.log(`Environment variables: NODE_ENV=${process.env.NODE_ENV}`);

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    // Add your Render frontend URL here if needed
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove any undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Mount routes
app.use('/api', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/drive', driveRoutes);

// Basic health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Add this after loading .env
console.log('Checking critical environment variables:');
['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'].forEach(key => {
  if (!process.env[key]) {
    console.error(`ERROR: ${key} is missing from environment variables!`);
    process.exit(1); // Exit the application if critical variables are missing
  } else {
    console.log(`✓ ${key} is set`);
  }
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');

    // Create HTTP server - IMPORTANT: bind to 0.0.0.0 for Render
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running at http://0.0.0.0:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Log server address info for debugging
      const addressInfo = server.address();
      console.log(`Server address info: ${JSON.stringify(addressInfo)}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app; 