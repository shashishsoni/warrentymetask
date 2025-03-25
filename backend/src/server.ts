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
const port = process.env.PORT || 3001;

// Initialize Prisma client
const prisma = new PrismaClient();

// Middleware
app.use(cors({
origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
],
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

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
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