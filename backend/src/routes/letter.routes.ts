import express from 'express';
import { createLetter, getLetters, updateLetter, deleteLetter } from '../controllers/letter.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// All routes need authentication
router.use(authenticateToken);

router.post('/', createLetter);
router.get('/', getLetters);
router.put('/:id', updateLetter);
router.delete('/:id', deleteLetter);

export default router; 