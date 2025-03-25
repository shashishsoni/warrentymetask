import express from 'express';
import { createLetter, getLetters, getLetter, updateLetter, deleteLetter, saveToGoogleDrive } from '../controllers/letter.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// All routes need authentication
router.use(authenticateToken);

router.post('/', createLetter);
router.get('/', getLetters);
router.get('/:id', getLetter);
router.put('/:id', updateLetter);
router.delete('/:id', deleteLetter);
router.post('/:id/save-to-drive', saveToGoogleDrive);

export default router; 