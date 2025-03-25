import express from 'express';
import { googleAuth, getCurrentUser, googleCallback, resetOAuth } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.post('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/google/callback', googleCallback);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

// Add this route to handle the root path redirect
router.get('/', googleCallback);

router.get('/reset', resetOAuth);

export default router; 