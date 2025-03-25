import express from 'express';
import { saveToDrive, listDriveFiles, getDriveFileContent } from '../controllers/drive.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Save a letter to Google Drive
router.post('/save', saveToDrive);

// List all letters from Google Drive
router.get('/files', listDriveFiles);

// Get a specific letter's content
router.get('/files/:fileId/content', getDriveFileContent);

export default router; 