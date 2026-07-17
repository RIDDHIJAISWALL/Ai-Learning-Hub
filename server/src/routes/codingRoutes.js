import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { reviewCode, generatePracticeQuestion } from '../controllers/codingController.js';

const router = express.Router();

router.post('/review', protect, reviewCode);
router.post('/practice', protect, generatePracticeQuestion);

export default router;
