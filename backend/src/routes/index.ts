import express from 'express';
import authRoutes from './auth.routes';

const router = express.Router();

// This ensures /api/auth/google/callback works properly
router.use('/auth', authRoutes);

export default router; 